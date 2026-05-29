import { isWeekendDay, isSchoolDayToday } from '../schoolDay';

describe('isWeekendDay (Israel week)', () => {
  // day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  test('Sunday–Thursday are never weekend, regardless of fridayEnabled', () => {
    for (const day of [0, 1, 2, 3, 4]) {
      expect(isWeekendDay(day, false)).toBe(false);
      expect(isWeekendDay(day, true)).toBe(false);
    }
  });

  test('Saturday is always weekend', () => {
    expect(isWeekendDay(6, false)).toBe(true);
    expect(isWeekendDay(6, true)).toBe(true);
  });

  test('Friday is weekend only when fridayEnabled is false', () => {
    expect(isWeekendDay(5, false)).toBe(true);  // Friday off → weekend
    expect(isWeekendDay(5, true)).toBe(false);  // family studies Friday → school day
  });
});

describe('isSchoolDayToday', () => {
  test('a non-weekend day is a school day only when school quest is enabled', () => {
    // Force "today" to a Tuesday (day 2) — never weekend.
    const realGetDay = Date.prototype.getDay;
    Date.prototype.getDay = () => 2;
    try {
      expect(isSchoolDayToday(false, true)).toBe(true);   // school quest on
      expect(isSchoolDayToday(false, false)).toBe(false); // school quest off
    } finally {
      Date.prototype.getDay = realGetDay;
    }
  });

  test('a weekend day is never a school day even with school quest on', () => {
    const realGetDay = Date.prototype.getDay;
    Date.prototype.getDay = () => 6; // Saturday
    try {
      expect(isSchoolDayToday(true, true)).toBe(false);
    } finally {
      Date.prototype.getDay = realGetDay;
    }
  });
});
