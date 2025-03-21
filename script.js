const monthYearElement = document.getElementById('month-year');
const datesElement = document.getElementById('dates');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const selectedDatesElement = document.getElementById('selected-dates');
const log_tag = "persian_date_picker : "

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

// Get the number of days in a Persian month
function getJalaliMonthCount(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapYear(year) ? 30 : 29; // Esfand has 30 days in leap years, 29 otherwise
}

function getGregorianMonthCount(year, month) {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
}

// Check if a Persian year is a leap year
function isLeapYear(year) {
    return [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
}

// Get the day of the week for a Jalali date
function jalaliDayOfWeek(year, month, day) {
    const gregorian = jalaliToGregorian(year, month, day);
    const date = new Date(gregorian.year, gregorian.month - 1, gregorian.day);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    console.log(log_tag + "firstDayOfWeek date in gregori-> " + date)
    console.log(log_tag + "firstDayOfWeek in gregori-> " + dayOfWeek)
    // Adjust for Jalali week (Saturday=0, Sunday=1, ..., Friday=6)
    return (dayOfWeek + 1) % 7;
}

// Render the calendar
function renderCalendar() {
    const { year, month, day } = getCurrentDate();
    const daysInMonth = calendarType === 'jalali' ?
        getJalaliMonthCount(year, month) :
        getGregorianMonthCount();

    const firstDayOfWeek = calendarType === 'jalali' ?
        jalaliDayOfWeek(year, month, 1) :
        new Date(year, month - 1, 1).getDay() + 1;

    console.log(log_tag + "firstDayOfWeek -> " + firstDayOfWeek)
    // Set the month and year
    monthYearElement.textContent = calendarType === 'jalali' ?
        `${persianMonths[month - 1]} ${year}` :
        `${gregorianMonths[month - 1]} ${year}`;

    // Clear previous dates
    datesElement.innerHTML = '';

    // Add empty cells for the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('span');
        datesElement.appendChild(emptyCell);
    }

    // Add dates
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('span');
        dateCell.textContent = day;
        dateCell.addEventListener('click', () => handleDateClick(day));
        datesElement.appendChild(dateCell);

        // Highlight selected range
        if (startDate !== null && endDate !== null && day >= startDate && day <= endDate) {
            dateCell.classList.add('in-range');
        }
        if (day === startDate || day === endDate) {
            dateCell.classList.add('selected');
        }
    }
}

// Handle date click
function handleDateClick(day) {
    if (selectionType === 'range') {
        if (startDate === null || (startDate !== null && endDate !== null)) {
            // Start a new range
            startDate = day;
            endDate = null;
        } else {
            // End the range
            endDate = day;
            if (startDate > endDate) {
                // Swap if start date is after end date
                [startDate, endDate] = [endDate, startDate];
            }
        }
    } else if (selectionType === 'single') {
        startDate = day;
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
    console.log(log_tag + "prevMonthButton -> " + currentDate)
    if (calendarType === 'jalali') {
        const jalaliDate = getCurrentDate();
        console.log(log_tag + "prevMonthButton jalali -> " + jalaliDate.year + "-" + jalaliDate.month + "-" + jalaliDate.day)
        jalaliDate.day = 1;
        jalaliDate.month -= 1;
        if (jalaliDate.month < 1) {
            jalaliDate.month = 12;
            jalaliDate.year -= 1;
        }
        console.log(log_tag + "prevMonthButton reduced month -> " + jalaliDate.year + "-" + jalaliDate.month + "-" + jalaliDate.day)
        const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
        currentDate = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
    }
    console.log(log_tag + "prevMonthButton current date after changed -> " + currentDate)
    renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
    console.log(log_tag + "nextMonthButton -> " + currentDate)
    if (calendarType === 'jalali') {
        const jalaliDate = getCurrentDate();
        console.log(log_tag + "nextMonthButton jalali -> " + jalaliDate.year + "-" + jalaliDate.month + "-" + jalaliDate.day)
        jalaliDate.day = 1;
        jalaliDate.month += 1;
        if (jalaliDate.month > 12) {
            jalaliDate.month = 1;
            jalaliDate.year += 1;
        }
        console.log(log_tag + "nextMonthButton increased month -> " + jalaliDate.year + "-" + jalaliDate.month + "-" + jalaliDate.day)
        const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
        currentDate = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    console.log(log_tag + "nextMonthButton current date after changed -> " + currentDate)

    renderCalendar();
});

// Initial render
renderCalendar();




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