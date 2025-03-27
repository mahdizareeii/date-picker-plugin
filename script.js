jQuery(document).ready(function ($) {
    'use strict';

    class PersianCalendar {
        constructor(container) {
            this.container = container;
            this.type = container.data('type') || persianCalendarSettings.defaultType || 'jalali';
            this.selection = container.data('selection') || persianCalendarSettings.defaultSelection || 'range';
            this.startDate = null;
            this.endDate = null;
            this.currentDate = new Date();
            this.settings = window.persianCalendarSettings || {};
            this.settings.disablePastDates = this.settings.disablePastDates === '1' || this.settings.disablePastDates === true;
            this.displayElement = document.getElementById('selected-dates');

            this.applySettings();
            this.init();
        }

        applySettings() {
            // Apply color settings
            if (this.settings.primaryColor) {
                this.container.css('--primary-color', this.settings.primaryColor);
            }
            if (this.settings.secondaryColor) {
                this.container.css('--secondary-color', this.settings.secondaryColor);
            }

            // Set direction based on calendar type
            this.container.attr('dir', this.type === 'jalali' ? 'rtl' : 'ltr');
        }

        init() {
            this.cacheElements();
            this.bindEvents();
            this.renderCalendar();
        }

        cacheElements() {
            this.elements = {
                monthYear: this.container.find('#month-year'),
                weekdays: this.container.find('#weekdays'),
                dates: this.container.find('#dates'),
                prevBtn: this.container.find('#prev-month'),
                nextBtn: this.container.find('#next-month')
            };
        }

        bindEvents() {
            this.elements.prevBtn.on('click', () => this.navigateMonth(-1));
            this.elements.nextBtn.on('click', () => this.navigateMonth(1));
            this.elements.dates.on('click', 'span:not(.disabled, .empty)', (e) => this.handleDateClick(e));
        }

        navigateMonth(offset) {
            if (this.type === 'jalali') {
                const jalaliDate = this.gregorianToJalali(
                    this.currentDate.getFullYear(),
                    this.currentDate.getMonth() + 1,
                    this.currentDate.getDate()
                );

                jalaliDate.month += offset;

                if (jalaliDate.month > 12) {
                    jalaliDate.month = 1;
                    jalaliDate.year++;
                } else if (jalaliDate.month < 1) {
                    jalaliDate.month = 12;
                    jalaliDate.year--;
                }

                const gregorianDate = this.jalaliToGregorian(jalaliDate.year, jalaliDate.month, 1);
                this.currentDate = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() + offset);
            }

            this.renderCalendar();
        }

        handleDateClick(e) {
            const day = parseInt($(e.target).text());
            const { year, month } = this.getCurrentDate();
            const date = this.getIndicedDate(year, month, day);

            if (this.selection === 'range') {
                if (!this.startDate || (this.startDate && this.endDate)) {
                    this.startDate = date;
                    this.endDate = null;
                } else {
                    this.endDate = date;
                    if (this.startDate > this.endDate) {
                        [this.startDate, this.endDate] = [this.endDate, this.startDate];
                    }
                }
            } else {
                this.startDate = date;
                this.endDate = null;
            }

            this.renderCalendar();
            this.updateSelectedDatesDisplay();
            this.saveSelectedDates();
        }

        renderCalendar() {
            const { year, month } = this.getCurrentDate();
            const daysInMonth = this.getDaysInMonth(year, month);
            const firstDayOfWeek = this.getFirstDayOfWeek(year, month);

            // Set month and year title
            const monthNames = this.type === 'jalali' ?
                ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] :
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            this.elements.monthYear.text(`${monthNames[month - 1]} ${year}`);

            // Render weekdays
            const weekdayNames = this.type === 'jalali' ?
                ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] :
                ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

            this.elements.weekdays.empty();
            weekdayNames.forEach(day => {
                this.elements.weekdays.append(`<span>${day}</span>`);
            });

            // Render dates
            this.elements.dates.empty();

            // Empty cells for first day
            for (let i = 0; i < firstDayOfWeek; i++) {
                this.elements.dates.append('<span class="empty"></span>');
            }

            // Date cells
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let day = 1; day <= daysInMonth; day++) {
                const date = this.getIndicedDate(year, month, day);
                const isToday = this.isSameDate(date, today);
                const isDisabled = this.shouldDisableDate(date);

                let classes = [];
                if (isToday) classes.push('today');
                if (isDisabled) classes.push('disabled');
                if (this.startDate && this.isSameDate(date, this.startDate)) classes.push('selected');
                if (this.endDate && this.isSameDate(date, this.endDate)) classes.push('selected');
                if (this.startDate && this.endDate && date > this.startDate && date < this.endDate) {
                    classes.push('in-range');
                }

                this.elements.dates.append(
                    `<span class="${classes.join(' ')}">${day}</span>`
                );
            }
        }

        updateSelectedDatesDisplay() {
            const display = $('#selected-dates');
            const displayElement = document.getElementById('selected-dates');

            if (!displayElement) {
                console.warn('Display element not found');
                return;
            }

            if (!this.startDate) {
                display.text(this.settings.i18n.noSelection || 'No dates selected.');
                return;
            }

            if (this.startDate && this.endDate) {
                this.displayElement.textContent =
                    `${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
            } else if (this.startDate) {
                this.displayElement.textContent =
                    `${this.formatDate(this.startDate)}`;
            } else {
                //this.displayElement.textContent = 'Please select a date';
            }

            // if (this.selection === 'range' && this.endDate) {
            //     const startStr = this.formatDate(this.startDate);
            //     const endStr = this.formatDate(this.endDate);
            //     display.text(`${this.settings.i18n.selectedRange || 'Selected Range:'} ${startStr} - ${endStr}`);
            // } else {
            //     const dateStr = this.formatDate(this.startDate);
            //     display.text(`${this.settings.i18n.selectedDate || 'Selected Date:'} ${dateStr}`);
            // }
        }

        saveSelectedDates() {
            const dates = {
                start: this.startDate ? this.startDate.toISOString() : null,
                end: this.endDate ? this.endDate.toISOString() : null,
                type: this.type,
                selection: this.selection
            };

            $.ajax({
                url: this.settings.ajaxurl,
                type: 'POST',
                data: {
                    action: 'persian_calendar_save_dates',
                    security: this.settings.nonce,
                    dates: JSON.stringify(dates)
                }
            });
        }

        formatDate(date) {
            if (!date) return '';

            if (this.type === 'jalali') {
                const jalali = this.gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
                return `${jalali.year}/${jalali.month}/${jalali.day}`;
            }

            return date.toLocaleDateString();
        }

        getCurrentDate() {
            if (this.type === 'jalali') {
                return this.gregorianToJalali(
                    this.currentDate.getFullYear(),
                    this.currentDate.getMonth() + 1,
                    this.currentDate.getDate()
                );
            }

            return {
                year: this.currentDate.getFullYear(),
                month: this.currentDate.getMonth() + 1,
                day: this.currentDate.getDate()
            };
        }

        getDaysInMonth(year, month) {
            if (this.type === 'jalali') {
                if (month <= 6) return 31;
                if (month <= 11) return 30;
                return this.isLeapYear(year) ? 30 : 29;
            }

            return new Date(year, month, 0).getDate();
        }

        getFirstDayOfWeek(year, month) {
            if (this.type === 'jalali') {
                const gregorian = this.jalaliToGregorian(year, month, 1);
                const date = new Date(gregorian.year, gregorian.month - 1, gregorian.day);
                return (date.getDay() + 1) % 7; // Convert to Jalali week (Sat=0, Sun=1, etc.)
            }

            return new Date(year, month - 1, 1).getDay();
        }

        getIndicedDate(year, month, day) {
            if (this.type === 'jalali') {
                const gregorian = this.jalaliToGregorian(year, month, day);
                return new Date(gregorian.year, gregorian.month - 1, gregorian.day);
            }

            return new Date(year, month - 1, day);
        }

        isSameDate(date1, date2) {
            if (!date1 || !date2) return false;
            return date1.toDateString() === date2.toDateString();
        }

        isLeapYear(year) {
            if (this.type === 'jalali') {
                return [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
            }

            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        }

        shouldDisableDate(date) {
            if (!this.settings.disablePastDates) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Create date-only objects for accurate comparison
            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return compareDate < compareToday;
        }

        // Date conversion functions
        gregorianToJalali(gy, gm, gd) {
            let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            let gy2 = (gm > 2) ? (gy + 1) : gy;
            let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
            let jy = -1595 + (33 * Math.floor(days / 12053));
            days %= 12053;
            jy += 4 * Math.floor(days / 1461);
            days %= 1461;

            if (days > 365) {
                jy += Math.floor((days - 1) / 365);
                days = (days - 1) % 365;
            }

            let jm, jd;
            if (days < 186) {
                jm = 1 + Math.floor(days / 31);
                jd = 1 + (days % 31);
            } else {
                jm = 7 + Math.floor((days - 186) / 30);
                jd = 1 + ((days - 186) % 30);
            }

            return { year: jy, month: jm, day: jd };
        }

        jalaliToGregorian(jy, jm, jd) {
            jy += 1595;
            let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
            let gy = 400 * Math.floor(days / 146097);
            days %= 146097;

            if (days > 36524) {
                gy += 100 * Math.floor(--days / 36524);
                days %= 36524;
                if (days >= 365) days++;
            }

            gy += 4 * Math.floor(days / 1461);
            days %= 1461;

            if (days > 365) {
                gy += Math.floor((days - 1) / 365);
                days = (days - 1) % 365;
            }

            let gd = days + 1;
            let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let gm;
            for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
                gd -= sal_a[gm];
            }

            return { year: gy, month: gm, day: gd };
        }
    }

    // Initialize all calendars on page
    $('.calendar').each(function () {
        new PersianCalendar($(this));
    });
});