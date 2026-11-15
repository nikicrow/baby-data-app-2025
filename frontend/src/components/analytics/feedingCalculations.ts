import type { FeedingSession } from '../../types/api';
import { addDays, parseISO, format, startOfDay, subDays, getHours, differenceInMinutes } from 'date-fns';

export function buildFeedingAnalytics(sessions: FeedingSession[], now: Date) {
  const feedings = sessions.filter(f => parseISO(f.start_time) < addDays(startOfDay(now), 1));
  const last7DaysFeedings = feedings.filter((f: FeedingSession) => {
    const feedDate = parseISO(f.start_time);
    return feedDate >= subDays(startOfDay(now), 6) && feedDate < addDays(startOfDay(now), 1);
  });

  // Calculate analytics from real data

  // 24-hour feeding pattern - group by 3-hour windows
  const feedingFrequencyData = Array.from({ length: 8 }, (_, i) => {
    const hourStart = i * 3;
    const timeLabel = `${hourStart === 0 ? 12 : hourStart > 12 ? hourStart - 12 : hourStart}${hourStart < 12 ? 'AM' : 'PM'}`;

    const feedsInWindow = last7DaysFeedings.filter((f: FeedingSession) => {
      const hour = getHours(parseISO(f.start_time));
      return hour >= hourStart && hour < hourStart + 3;
    });

    const avgDuration = feedsInWindow.length > 0
      ? feedsInWindow.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / feedsInWindow.length
      : 0;

    return {
      time: timeLabel,
      feeds: feedsInWindow.length,
      avgDuration: Math.round(avgDuration),
      efficiency: avgDuration > 0 ? Math.min(100, Math.round((avgDuration / 30) * 100)) : 0, // Rough efficiency based on duration
    };
  });

  // Last 7 days feeding trends
  const feedingTrendsData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dayFeedings = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return startOfDay(feedDate).getTime() === startOfDay(date).getTime();
    });

    const breastFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'breast').length;
    const bottleFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'bottle').length;
    const solidFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'solid').length;
    const totalVolume = dayFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.volume_consumed_ml || 0), 0);

    return {
      date: format(date, 'MMM d'),
      breastFeeds,
      bottleFeeds,
      solidFeeds,
      totalVolume,
    };
  });

  // Calculate feeding intervals
  const sortedFeedings = [...feedings].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const intervals = sortedFeedings.slice(1).map((feed, i) => {
    const prevFeed = sortedFeedings[i];
    return differenceInMinutes(parseISO(feed.start_time), parseISO(prevFeed.start_time));
  });

  const intervalCounts = {
    '0-1h': intervals.filter(i => i >= 0 && i < 60).length,
    '1-2h': intervals.filter(i => i >= 60 && i < 120).length,
    '2-3h': intervals.filter(i => i >= 120 && i < 180).length,
    '3-4h': intervals.filter(i => i >= 180 && i < 240).length,
    '4+h': intervals.filter(i => i >= 240).length,
  };

  const totalIntervals = intervals.length || 1;
  const feedingIntervalsData = [
    { interval: '0-1h', count: intervalCounts['0-1h'], percentage: Math.round((intervalCounts['0-1h'] / totalIntervals) * 100) },
    { interval: '1-2h', count: intervalCounts['1-2h'], percentage: Math.round((intervalCounts['1-2h'] / totalIntervals) * 100) },
    { interval: '2-3h', count: intervalCounts['2-3h'], percentage: Math.round((intervalCounts['2-3h'] / totalIntervals) * 100) },
    { interval: '3-4h', count: intervalCounts['3-4h'], percentage: Math.round((intervalCounts['3-4h'] / totalIntervals) * 100) },
    { interval: '4+h', count: intervalCounts['4+h'], percentage: Math.round((intervalCounts['4+h'] / totalIntervals) * 100) },
  ];

  // Count every side used; a two-sided feed contributes to both sides.
  const sidePreferenceData = (['left', 'right'] as const).map(side => {
    const durations = feedings.filter(f => f.feeding_type === 'breast')
      .map(f => f[side === 'left' ? 'left_breast_duration' : 'right_breast_duration'] ?? 0)
      .filter(duration => duration > 0);
    return { name: side === 'left' ? 'Left' : 'Right', count: durations.length,
      color: side === 'left' ? '#8884d8' : '#82ca9d',
      avgDuration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0 };
  });
  const sideCount = sidePreferenceData.reduce((sum, side) => sum + side.count, 0);
  const sidePreferences = sidePreferenceData.map(side => ({ ...side,
    value: sideCount ? Math.round(side.count / sideCount * 100) : 0,
  })).filter(side => side.count > 0);

  // Volume progress (last 6 weeks)
  const volumeProgressData = Array.from({ length: 6 }, (_, i) => {
    const weekEnd = subDays(addDays(startOfDay(now), 1), (5 - i) * 7);
    const weekStart = subDays(weekEnd, 7);

    const weekFeedings = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return feedDate >= weekStart && feedDate < weekEnd;
    });

    const bottleFeedings = weekFeedings.filter((f: FeedingSession) => f.feeding_type === 'bottle');
    const avgBottle = bottleFeedings.length > 0
      ? bottleFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.volume_consumed_ml || 0), 0) / bottleFeedings.length
      : 0;

    const dailyTotal = weekFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.volume_consumed_ml || 0), 0) / 7;

    return {
      week: `Week ${i + 1}`,
      avgBottle: Math.round(avgBottle),
      dailyTotal: Math.round(dailyTotal),
    };
  });

  // Cluster feeding analysis (2-hour windows)
  const clusterFeedingData = [
    { timeRange: '5-7PM', start: 17, end: 19 },
    { timeRange: '7-9PM', start: 19, end: 21 },
    { timeRange: '9-11PM', start: 21, end: 23 },
    { timeRange: '11PM-1AM', start: 23, end: 1 },
    { timeRange: '1-3AM', start: 1, end: 3 },
    { timeRange: '3-5AM', start: 3, end: 5 },
  ].map(window => {
    const feedsInWindow = last7DaysFeedings.filter((f: FeedingSession) => {
      const hour = getHours(parseISO(f.start_time));
      if (window.start > window.end) {
        // Crosses midnight
        return hour >= window.start || hour < window.end;
      }
      return hour >= window.start && hour < window.end;
    });

    const frequency = feedsInWindow.length / 7; // Average per day over week
    const isCluster = frequency > 2; // More than 2 feeds in 2-hour window = cluster

    return {
      timeRange: window.timeRange,
      frequency: Number(frequency.toFixed(1)),
      avgInterval: 0,
      isCluster,
    };
  });

  // Calculate key metrics


  const dailyAverage = (last7DaysFeedings.length / 7).toFixed(1);
  const avgDuration = feedings.length > 0
    ? Math.round(feedings.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / feedings.length)
    : 0;

  const todayVolume = feedings.filter((f: FeedingSession) => {
    const feedDate = parseISO(f.start_time);
    return startOfDay(feedDate).getTime() === startOfDay(now).getTime();
  }).reduce((sum: number, f: FeedingSession) => sum + (f.volume_consumed_ml || 0), 0);

  const avgVolume = feedingTrendsData.reduce((sum, d) => sum + d.totalVolume, 0) / 7;

  return { feedingFrequencyData, feedingTrendsData, intervals, intervalCounts, totalIntervals, feedingIntervalsData, volumeProgressData, clusterFeedingData, dailyAverage, avgDuration, todayVolume, avgVolume, sidePreferenceData: sidePreferences };
}
