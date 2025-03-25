const monthYearElement = document.getElementById('month-year');
const weekdaysElement = document.getElementById('weekdays');
const datesElement = document.getElementById('dates');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const selectedDatesElement = document.getElementById('selected-dates');

// Persian month names
const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// Gregorian month names
const gregorianMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Selected range
let startDate = null;
let endDate = null;
let currentDate = new Date(); // Gregorian date
let calendarType = document.querySelector('.calendar').dataset.type;
let selectionType = document.querySelector('.calendar').dataset.selection;

// Get the current date based on calendar type
function getCurrentDate() {
    if (calendarType === 'jalali') {
        return gregorianToJalali(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    } else {
        return {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            day: currentDate.getDate()
        };
    }
}

function getIndicedDate(year, month, day) {
    if (calendarType === 'jalali') {
        let gregorianDate = jalaliToGregorian(year, month, day);
        return new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
    } else {
        return new Date(year, month - 1, day);
    }
}

// Get the number of days in a Persian month
function getJalaliMonthCount(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapYear(year) ? 30 : 29; // Esfand has 30 days in leap years, 29 otherwise
}

function getGregorianMonthCount(year, month) {
    return new Date(year, month, 0).getDate();
}

// Check if a Persian year is a leap year
function isLeapYear(year) {
    return [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
}

// Get the day of the week for a Jalali date
function jalaliDayOfWeek(year, month) {
    const gregorian = jalaliToGregorian(year, month, 1);
    const date = new Date(gregorian.year, gregorian.month - 1, gregorian.day);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Adjust for Jalali week (Saturday=0, Sunday=1, ..., Friday=6)
    return (dayOfWeek + 1) % 7;
}

function gregorianDayOfWeek(year, month) {
    return new Date(year, month - 1, 1).getDay();
}

// Render the calendar
function renderCalendar() {
    document.querySelector('.calendar').setAttribute('dir', calendarType === 'jalali' ? 'rtl' : 'ltr');
    document.querySelector('.calendar-header').setAttribute('dir', 'rtl');

    const { year, month, day } = getCurrentDate();
    const daysInMonth = calendarType === 'jalali' ? getJalaliMonthCount(year, month) : getGregorianMonthCount(year, month);
    const firstDayOfWeek = calendarType === 'jalali' ? jalaliDayOfWeek(year, month) : gregorianDayOfWeek(year, month);

    // Set the month and year
    monthYearElement.textContent = calendarType === 'jalali' ?
        `${persianMonths[month - 1]} ${year}` :
        `${gregorianMonths[month - 1]} ${year}`;

    //init weeks
    const weekdays = calendarType === 'jalali' ? ["ش", "ی", "د", "س", "چ", "پ", "ج"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    weekdaysElement.innerHTML = '';
    weekdays.forEach(day => {
        const span = document.createElement('span');
        span.textContent = day;
        weekdaysElement.appendChild(span);
    });

    // Clear previous dates
    datesElement.innerHTML = '';

    // Add empty cells for the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('span');
        datesElement.appendChild(emptyCell);
    }

    // Add dates
    for (let day = 1; day <= daysInMonth; day++) {
        let indicedDate = getIndicedDate(year, month, day);

        const dateCell = document.createElement('span');
        dateCell.textContent = day;
        dateCell.addEventListener('click', () => handleDateClick(indicedDate));
        datesElement.appendChild(dateCell);

        // Highlight selected range
        if (isSameDate(indicedDate, startDate) || isSameDate(indicedDate, endDate)) {
            console.log("highlight selected -> " + indicedDate.toISOString())
            dateCell.classList.add('selected');
        }
        if (startDate !== null && endDate !== null && indicedDate > startDate && indicedDate < endDate) {
            console.log("highlight inrange -> " + indicedDate.toISOString())
            dateCell.classList.add('in-range');
        }
    }
}

// Handle date click
function handleDateClick(date) {
    if (selectionType === 'range') {
        if (startDate === null || (startDate !== null && endDate !== null)) {
            // Start a new range
            startDate = date;
            endDate = null;
        } else {
            // End the range
            endDate = date;
            if (startDate > endDate) {
                // Swap if start date is after end date
                [startDate, endDate] = [endDate, startDate];
            }
        }
    } else if (selectionType === 'single') {
        startDate = date;
        endDate = null;
    }

    // Re-render the calendar to update the selection
    renderCalendar();

    // Update selected dates display
    updateSelectedDates();
}

// Update selected dates display
function updateSelectedDates() {
    if (selectionType === 'range' && startDate !== null && endDate !== null) {
        selectedDatesElement.textContent = `Selected Range: ${startDate} to ${endDate}`;
    } else if (selectionType === 'single' && startDate !== null) {
        selectedDatesElement.textContent = `Selected Date: ${startDate}`;
    } else {
        selectedDatesElement.textContent = 'No dates selected.';
    }
}

// Handle month navigation
prevMonthButton.addEventListener('click', () => {
    if (calendarType === 'jalali') {
        const jalaliDate = getCurrentDate();
        jalaliDate.day = 1;
        jalaliDate.month -= 1;
        if (jalaliDate.month < 1) {
            jalaliDate.month = 12;
            jalaliDate.year -= 1;
        }
        const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
        currentDate = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
    }
    renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
    if (calendarType === 'jalali') {
        const jalaliDate = getCurrentDate();
        jalaliDate.day = 1;
        jalaliDate.month += 1;
        if (jalaliDate.month > 12) {
            jalaliDate.month = 1;
            jalaliDate.year += 1;
        }
        const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
        currentDate = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    renderCalendar();
});

// Initial render
renderCalendar();




function isSameDate(date1, date2) {
    if (date1 == null && date2 == null) return true
    if (date1 == null && date2 != null) return false
    if (date1 != null && date2 == null) return false
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}


function gregorianToJalali(gy, gm, gd) {
    var g_d_m, jy, jm, jd, gy2, days;
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    gy2 = (gm > 2) ? (gy + 1) : gy;
    days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    jy = -1595 + (33 * ~~(days / 12053));
    days %= 12053;
    jy += 4 * ~~(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += ~~((days - 1) / 365);
        days = (days - 1) % 365;
    }
    if (days < 186) {
        jm = 1 + ~~(days / 31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + ~~((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }
    return { year: jy, month: jm, day: jd };
}

function jalaliToGregorian(jy, jm, jd) {
    var sal_a, gy, gm, gd, days;
    jy += 1595;
    days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy = 400 * ~~(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * ~~(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * ~~(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += ~~((days - 1) / 365);
        days = (days - 1) % 365;
    }
    gd = days + 1;
    sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return { year: gy, month: gm, day: gd };
}