import { ArchiveItem } from '@/src/services/archiveService';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthData {
  year: number;
  month: number; // 0-indexed
  key: string;
  days: Map<number, ArchiveItem[]>; // day number → items
}

interface Props {
  items: ArchiveItem[];
  isDark: boolean;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  onDayPress: (dayItems: ArchiveItem[]) => void;
}

/**
 * Builds a full chronological month range from the earliest archivedAt
 * to the latest, filling gap months with empty day maps. If items is
 * empty, returns just the current month so the calendar is never blank.
 */
function buildMonths(items: ArchiveItem[]): MonthData[] {
  // Index every item by year-month-day
  const dayIndex = new Map<string, ArchiveItem[]>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  items.forEach((item) => {
    const d = new Date(item.archivedAt);
    if (!minDate || d < minDate) minDate = d;
    if (!maxDate || d > maxDate) maxDate = d;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayIndex.has(key)) dayIndex.set(key, []);
    dayIndex.get(key)!.push(item);
  });

  // Always extend to at least the current month
  const now = new Date();
  const startY = minDate ? minDate.getFullYear() : now.getFullYear();
  const startM = minDate ? minDate.getMonth() : now.getMonth();
  const maxY = maxDate ? maxDate.getFullYear() : now.getFullYear();
  const maxM = maxDate ? maxDate.getMonth() : now.getMonth();
  const nowY = now.getFullYear();
  const nowM = now.getMonth();
  const endY = (nowY > maxY || (nowY === maxY && nowM > maxM)) ? nowY : maxY;
  const endM = (nowY > maxY || (nowY === maxY && nowM > maxM)) ? nowM : maxM;

  const result: MonthData[] = [];
  let y = startY;
  let m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    const days = new Map<number, ArchiveItem[]>();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${y}-${m}-${d}`;
      if (dayIndex.has(k)) days.set(d, dayIndex.get(k)!);
    }
    result.push({ year: y, month: m, key: `${y}-${m}`, days });
    m++;
    if (m > 11) { m = 0; y++; }
  }

  return result;
}

// ========== Day Cell ==========
const DayCell = React.memo(({
  day,
  items,
  isFuture,
  isToday,
  subtextColor,
  accentColor,
  onPress,
}: {
  day: number;
  items: ArchiveItem[] | undefined;
  isFuture: boolean;
  isToday: boolean;
  subtextColor: string;
  accentColor: string;
  onPress: () => void;
}) => {
  const hasItems = !isFuture && items && items.length > 0;
  const thumb = hasItems ? (items[0].thumbnailUrl || items[0].mediaUrl) : null;

  return (
    <TouchableOpacity
      style={[cs.dayCell, isFuture && cs.dayFuture]}
      onPress={hasItems ? onPress : undefined}
      activeOpacity={hasItems ? 0.7 : 1}
      disabled={!hasItems}
    >
      {thumb ? (
        <>
          <Image
            source={{ uri: thumb }}
            style={cs.dayThumb}
            contentFit="cover"
            transition={150}
          />
          <View style={cs.dayOverlay} />
          <Text style={cs.dayTextOnImage}>{day}</Text>
          {items!.length > 1 && (
            <View style={[cs.dayCount, { backgroundColor: accentColor }]}>
              <Text style={cs.dayCountText}>{items!.length}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          {isToday && <View style={[cs.todayCircle, { backgroundColor: accentColor }]} />}
          <Text
            style={[
              cs.dayText,
              { color: isFuture ? subtextColor : subtextColor },
              isToday && cs.todayText,
              isFuture && { opacity: 0.35 },
            ]}
          >
            {day}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
});

// ========== Main Calendar ==========
export default function ArchiveCalendarView({
  items,
  isDark,
  textColor,
  subtextColor,
  accentColor,
  onDayPress,
}: Props) {
  const months = useMemo(() => buildMonths(items), [items]);

  // Today boundary — computed on every render (lightweight)
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  return (
    <ScrollView
      style={cs.scroll}
      contentContainerStyle={cs.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {months.map((md) => {
        const firstDayOfWeek = new Date(md.year, md.month, 1).getDay();
        const daysInMonth = new Date(md.year, md.month + 1, 0).getDate();
        const weeks: (number | null)[][] = [];
        let week: (number | null)[] = new Array(firstDayOfWeek).fill(null);

        for (let d = 1; d <= daysInMonth; d++) {
          week.push(d);
          if (week.length === 7) {
            weeks.push(week);
            week = [];
          }
        }
        if (week.length > 0) {
          while (week.length < 7) week.push(null);
          weeks.push(week);
        }

        return (
          <View key={md.key} style={cs.monthBlock}>
            {/* Month Header */}
            <Text style={[cs.monthTitle, { color: textColor }]}>
              {MONTH_NAMES[md.month]} {md.year}
            </Text>

            {/* Weekday Labels */}
            <View style={cs.weekdayRow}>
              {WEEKDAYS.map((wd) => (
                <View key={wd} style={cs.weekdayCell}>
                  <Text style={[cs.weekdayText, { color: subtextColor }]}>{wd}</Text>
                </View>
              ))}
            </View>

            {/* Weeks */}
            {weeks.map((wk, wi) => (
              <View key={`${md.key}-w${wi}`} style={cs.weekRow}>
                {wk.map((day, di) => {
                  if (day === null) {
                    return <View key={`empty-${di}`} style={cs.dayCell} />;
                  }
                  const dayItems = md.days.get(day);
                  const isFuture =
                    md.year > todayY ||
                    (md.year === todayY && md.month > todayM) ||
                    (md.year === todayY && md.month === todayM && day > todayD);
                  const isToday = md.year === todayY && md.month === todayM && day === todayD;
                  return (
                    <DayCell
                      key={`${md.year}-${md.month}-${day}`}
                      day={day}
                      items={dayItems}
                      isFuture={isFuture}
                      isToday={isToday}
                      subtextColor={subtextColor}
                      accentColor={accentColor}
                      onPress={() => dayItems && onDayPress(dayItems)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const cs = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  monthBlock: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayThumb: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  dayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayTextOnImage: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    zIndex: 2,
  },
  dayCount: {
    position: 'absolute',
    top: 3,
    right: 3,
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  dayCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  dayFuture: {
    opacity: 0.35,
  },
  todayCircle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.15,
  },
  todayText: {
    fontWeight: '800',
  },
});
