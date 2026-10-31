import json
from types import SimpleNamespace

import pytest

from app.sleep_training import api, metrics, multipart, save, train


def test_multipart_order_and_bytes():
    body, content_type = multipart({"name": "test"}, b"x,y\r\n1,yes\r\n")
    assert body.index(b'name="request"') < body.index(b'name="file"')
    assert b"x,y\r\n1,yes\r\n" in body
    assert "boundary=" in content_type


@pytest.mark.parametrize("url", ["https://evil.example/v1/fit", "http://training.19th.com/v1/fit",
                                "https://training.19th.com.evil.example/v1/fit"])
def test_no_credentials_to_other_origins(url):
    with pytest.raises(ValueError, match="origin"):
        api(url)


def test_evaluation_metrics():
    assert metrics([0, 1], [0, 1])["brier_score"] == 0
    assert metrics([0, 1], [.5, .5])["brier_score"] == .25


def test_training_recovers_same_key_after_timeout(tmp_path, monkeypatch):
    import hashlib
    import app.sleep_training as cli

    data = b"feature,label\r\n1,yes\r\n0,no\r\n"
    for horizon in (30, 60):
        (tmp_path / f"train-{horizon}.csv").write_bytes(data)
        save(tmp_path / f"request-{horizon}.json", {
            "file": {"content_length": len(data), "sha256": hashlib.sha256(data).hexdigest()}})
    calls = []

    def fail(url, body, content_type, key):
        calls.append(key)
        raise TimeoutError()

    monkeypatch.setattr(cli, "api", fail)
    args = SimpleNamespace(out=tmp_path)
    for _ in range(2):
        with pytest.raises(TimeoutError):
            train(args)
    assert len(calls) == 2 and calls[0] == calls[1]
    (tmp_path / "train-30.csv").write_bytes(b"changed")
    with pytest.raises(ValueError, match="CSV changed"):
        train(args)


def test_existing_run_is_not_submitted_again(tmp_path, monkeypatch):
    import app.sleep_training as cli
    for h in (30, 60):
        save(tmp_path / f"fit-{h}.json", {"state": "training"})
    monkeypatch.setattr(cli, "api", lambda *a: pytest.fail("Should not resubmit"))
    train(SimpleNamespace(out=tmp_path))
