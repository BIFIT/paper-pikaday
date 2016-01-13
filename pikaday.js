/**
 * Pikaday
 *
 * Copyright © 2015 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 * Copyright © 2015 Denis Baskovsky (Changes)
 */
'use strict';
(function (window, document, sto) {
  const MM = 'Минуты';
  const HH = 'Часы';

  var addEvent = function (el, e, callback, capture) {
      el.addEventListener(e, callback, !!capture);
    },

    removeEvent = (el, e, callback, capture) => {
      el.removeEventListener(e, callback, !!capture);
    },

    fireEvent = (el, eventName, data) => {
      let ev;

      if (document.createEvent) {
        ev = document.createEvent('HTMLEvents');
        ev.initEvent(eventName, true, false);
        ev = extend(ev, data);
        el.dispatchEvent(ev);
      } else if (document.createEventObject) {
        ev = document.createEventObject();
        ev = extend(ev, data);
        el.fireEvent('on' + eventName, ev);
      }
    },

    trim = function (str) {
      return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    hasClass = function (el, cn) {
      return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = function (el, cn) {
      if (!hasClass(el, cn)) {
        el.className = (el.className === '') ? cn : el.className + ' ' + cn;
      }
    },

    removeClass = function (el, cn) {
      el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    isArray = function (obj) {
      return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = function (obj) {
      return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isWeekend = function (date) {
      var day = date.getDay();
      return day === 0 || day === 6;
    },

    isLeapYear = function (year) {
      // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
      return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function (year, month) {
      return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    compareDates = function (a, b) {
      return a.getTime() === b.getTime();
    },

    extend = function (to, from, overwrite) {
      var prop, hasProp;
      for (prop in from) {
        hasProp = to[prop] !== undefined;
        if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {

          if (isDate(from[prop])) {
            if (overwrite) {
              to[prop] = new Date(from[prop].getTime());
            }
          } else if (isArray(from[prop])) {
            if (overwrite) {
              to[prop] = from[prop].slice(0);
            }
          } else {
            to[prop] = extend({}, from[prop], overwrite);
          }

        } else if (overwrite || !hasProp) {
          to[prop] = from[prop];
        }
      }

      return to;
    },

    adjustCalendar = function (calendar) {
      if (calendar.month < 0) {
        calendar.year -= Math.ceil(Math.abs(calendar.month) / 12);
        calendar.month += 12;
      }

      if (calendar.month > 11) {
        calendar.year += Math.floor(Math.abs(calendar.month) / 12);
        calendar.month -= 12;
      }

      return calendar;
    },

    /**
     * defaults and localisation
     */
    defaults = {

      // bind the picker to a form field
      field: null,

      // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
      bound: undefined,

      // position of the datepicker, relative to the field (default to bottom & left)
      // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
      position: 'bottom left',

      // automatically fit in the viewport even if it means repositioning from the position option
      reposition: true,

      // the default output format for `.toString()` and `field` value
      format: 'YYYY-MM-DD',

      // the initial date to view when first opened
      defaultDate: null,

      // make the `defaultDate` the initial selected value
      setDefaultDate: false,

      // first day of week (0: Sunday, 1: Monday etc)
      firstDay: 0,

      // the minimum/earliest date that can be selected
      minDate: null,
      // the maximum/latest date that can be selected
      maxDate: null,

      // number of years either side, or array of upper/lower range
      yearRange: 10,

      // show week numbers at head of row
      showWeekNumber: false,

      // used internally (don't config outside)
      minYear: 0,
      maxYear: 9999,
      minMonth: undefined,
      maxMonth: undefined,

      startRange: null,
      endRange: null,

      isRTL: false,

      // Additional text to append to the year in the calendar title
      yearSuffix: '',

      // Render the month after year in the calendar title
      showMonthAfterYear: false,

      // how many months are visible
      numberOfMonths: 1,

      // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
      // only used for the first display or when a selected date is not visible
      mainCalendar: 'left',

      // Specify a DOM element to render the calendar in
      container: undefined,

      // internationalization
      i18n: {
        previousMonth: 'Previous Month',
        nextMonth: 'Next Month',
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        weekdays: ['Воскресение', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
      },

      // callback function
      onSelect: null,
      onOpen: null,
      onClose: null,
      onDraw: null
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function (opts, day, abbr) {
      day += opts.firstDay;
      while (day >= 7) {
        day -= 7;
      }

      return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function (opts) {
      if (opts.isEmpty) {
        return '<td class="is-empty"></td>';
      }

      let button = '<button type="button" class="pika-button pika-day" ';

      var arr = [];
      if (opts.isDisabled) {
        arr.push('is-disabled');
        button += ' disabled ';
      }
      if (opts.isToday) {
        arr.push('is-today');
      }
      if (opts.isSelected) {
        arr.push('is-selected');
        button += ' active ';
      }
      if (opts.isInRange) {
        arr.push('is-inrange');
      }
      if (opts.isStartRange) {
        arr.push('is-startrange');
      }
      if (opts.isEndRange) {
        arr.push('is-endrange');
      }

      button += 'data-pika-year="' + opts.year +
        '" data-pika-month="' + opts.month +
        '" data-pika-day="' + opts.day + '">' +
        opts.day +
        '</button>';

      return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '">' +
        button +
        '</td>';
    },

    /**
     * Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
     */
    renderWeek = (d, m, y) => {
      let onejan = new Date(y, 0, 1);
      let weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay() + 1) / 7);

      return `<td class="pika-week">${weekNum}</td>`;
    },

    renderRow = (days, isRTL) => {
      return '<tr>' + (isRTL ? days.reverse() : days).join('') + '</tr>';
    },

    renderBody = (rows) => {
      return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = (opts) => {
      let arr = [];
      if (opts.showWeekNumber) {
        arr.push('<th></th>');
      }
      for (let i = 0; i < 7; i++) {
        arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
      }

      return '<thead>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</thead>';
    },

    renderHours = (instance, hh) => {
      let body = '';

      body += '<span class="drop-menu"><p>Часы</p>';
      body += `<paper-dropdown-menu label="${HH}" no-animations no-label-float>`;
      body += '<paper-menu class="dropdown-content">';

      // шаг в 2 часа
      for (let i = 0; i < 24; i += 2) {
        let text = i < 10 ?
          '0' + i :
          i;

        body += `<paper-item>${text}</paper-item>`;
      }

      body += '</paper-menu></paper-dropdown-menu></span>';

      sto(() => {
        setHH.bind(instance)(hh);
      }, 0);

      return body;
    },

    renderMinutes = (instance, mm) => {
      let body = '';
      body += '<span class="drop-menu"><p>Минуты</p>';
      body += `<paper-dropdown-menu label="${MM}" no-animations no-label-float>`;
      body += '<paper-menu class="dropdown-content">';

      // шаг в 5 минут
      for (let i = 0; i < 60; i += 5) {
        const text = i < 10 ? '0' + i : i;

        body += '<paper-item>' + text + '</paper-item>';
      }

      body += '</paper-menu></paper-dropdown-menu></span>';

      sto(() => {
        setMM.bind(instance)(mm);
      }, 0);

      return body;

    },

    renderTitle = function (instance, c, year, month, refYear) {
      let i;
      let j;
      let arr;
      let opts = instance._o;
      let isMinYear = year === opts.minYear;
      let isMaxYear = year === opts.maxYear;
      let html = '<div class="pika-title">';
      let monthHtml;
      let yearHtml;
      let prev = true;
      let next = true;

      for (arr = [], i = 0; i < 12; i++) {
        arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
          (i === month ? ' selected' : '') +
          ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled' : '') + '>' +
          opts.i18n.months[i] + '</option>');
      }
      monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

      if (isArray(opts.yearRange)) {
        i = opts.yearRange[0];
        j = opts.yearRange[1] + 1;
      } else {
        i = year - opts.yearRange;
        j = 1 + year + opts.yearRange;
      }

      for (arr = []; i < j && i <= opts.maxYear; i++) {
        if (i >= opts.minYear) {
          arr.push('<option value="' + i + '"' + (i === year ? ' selected' : '') + '>' + (i) + '</option>');
        }
      }
      yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

      if (opts.showMonthAfterYear) {
        html += yearHtml + monthHtml;
      } else {
        html += monthHtml + yearHtml;
      }

      if (isMinYear && (month === 0 || opts.minMonth >= month)) {
        prev = false;
      }

      if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
        next = false;
      }

      if (c === 0) {
        var prevBtn = '<button type="button" ';
        prevBtn += 'class="pika-prev ';
        if (!prev) {
          prevBtn += ' is-disabled"';
          prevBtn += ' disabled ';
        } else {
          prevBtn += '"';
        }
        prevBtn += '>' + opts.i18n.previousMonth;
        prevBtn += '</button>';

        html += prevBtn;
      }

      if (c === (instance._o.numberOfMonths - 1)) {
        var nextBtn = '<button type="button"';
        nextBtn += ' class="pika-next ';
        if (!next) {
          nextBtn += ' is-disabled"';
          nextBtn += ' disabled ';
        } else {
          nextBtn += '"';
        }
        nextBtn += '>' + opts.i18n.nextMonth;
        nextBtn += '</button>';

        html += nextBtn;
      }

      return html += '</div>';
    },

    renderTable = (opts, data) => {
      return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },

    setMM = function (mm) {
      getMMInput.bind(this.el)().value = mm;
    },

    getMM = function () {
      return Number.parseInt(getMMInput.bind(this)().value || 0.0);
    },

    setHH = function (hh) {
      getHHInput.bind(this.el)().value = hh;
    },

    getHH = function () {
      return Number.parseInt(getHHInput.bind(this)().value || 0.0);
    },

    getMMInput = function () {
      return this.querySelector(`[label="${MM}"] paper-input`);
    },

    getHHInput = function () {
      return this.querySelector(`[label="${HH}"] paper-input`);
    },

    hideDropdowns = function (instance) {
      var $pdm;
      // TODO: неправильно кидается this
      try {
        $pdm = instance.querySelectorAll('paper-dropdown-menu');
      } catch (e) {
        return false;
      }

      for (let i = 0; i < $pdm.length; i++) {
        let e = $pdm[i];

        if (e.opened) {
          e.close();
        }
      }

    },

    getFormatDate = function (instance, target, self) {
      var hh, mm, yyyy, MM, dd;

      if (instance.tagName === 'PAPER-MATERIAL') {
        hh = getHH.bind(instance)();
        mm = getMM.bind(instance)();

        if (self && self.calendars) {
          let cDate = self.calendars[0];
          yyyy = cDate.year;
          MM = cDate.month;
          dd = cDate.day;
        }

      } else if (instance.el) {
        hh = getHH.bind(instance.el)();
        mm = getMM.bind(instance.el)();

        yyyy = instance.calendars && instance.calendars[0].year;
        MM = instance.calendars && instance.calendars[0].month;

        dd = 1;

        try {
          dd = self.getDate && self.getDate().getDate();
        } catch (e) {
          console.warn('date is not select, default by 1');
        }
      }

      if (target) {
        dd = target.getAttribute('data-pika-day');
        MM = target.getAttribute('data-pika-month');
        yyyy = target.getAttribute('data-pika-year');
      }

      return new Date(yyyy, MM, dd, hh, mm);
    },

    /**
     * Pikaday constructor
     */
    Pikaday = function (options) {
      var self = this,
        opts = self.config(options);

      self._onMouseDown = function (e) {
        if (!self._v) {
          return;
        }
        e = e || window.event;

        var target = e.target || e.srcElement;
        if (!target) {
          return;
        }

        switch (target.tagName) {
          case 'PAPER-MATERIAL':
            return;

          // Если кликаем на выпадающий список - обновляем значения
          // и пропускаем обработчик закрытия окна
          case 'PAPER-ITEM':
            let date = getFormatDate(this, null, self);
            let labelName = target.closest('[label]').getAttribute('label');
            let newVal = String(target.textContent);

            if (HH === labelName) {
              date.setHours(newVal);
              self.calendars[0].hour = newVal;
            } else if (MM === labelName) {
              date.setMinutes(newVal);
              self.calendars[0].minute = newVal;
            }

            self._d = date;
            self.setFieldFormat();

            return;

          default:
            break;
        }


        if (target.getAttribute('data-pika-year')) {
          self._d = getFormatDate(this, target);
        }

        if (!hasClass(target.parentNode, 'is-disabled')) {

          var paperBtn = target.closest('.pika-button');
          if (paperBtn && !paperBtn.classList.contains('is-empty')) {
            var formatDate = getFormatDate(this, paperBtn);
            self.setDate(formatDate);
            return;
          } else if (hasClass(target, 'pika-prev')) {
            self.prevMonth();
          } else if (hasClass(target, 'pika-next')) {
            self.nextMonth();
          }

        }
        if (!hasClass(target, 'pika-select')) {
          hideDropdowns(this);

          if (e.preventDefault) {
            e.preventDefault();
          } else {
            e.returnValue = false;

            return e.returnValue;
          }
        } else {
          self._c = true;
        }
      };

      self._onChange = function (e) {
        e = e || window.event;
        let target = e.target || e.srcElement;

        if (!target) {
          return;
        }

        if (hasClass(target, 'pika-select-month')) {
          self.gotoMonth(target.value);
        } else if (hasClass(target, 'pika-select-year')) {
          self.gotoYear(target.value);
        }
      };

      self._onInputChange = function (e) {
        if (e.firedBy === self) {
          return;
        }

        let date = new Date(Date.parse(opts.field.value));

        if (isDate(date)) {
          self.setDate(date);
        }
        if (!self._v) {
          self.show();
        }
      };

      self._onInputFocus = () => {
        self.show();
      };

      self._onInputClick = () => {
        self.show();
      };

      self._onInputBlur = function () {
        // IE allows pika div to gain focus; catch blur the input field
        let pEl = document.activeElement;

        do {
          if (hasClass(pEl, 'pika-single')) {
            return;
          }
        } while ((pEl = pEl.parentNode));

        self._c = false;
      };

      self._onClick = function (e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
          pEl = target;

        if (!target) {
          return;
        }

        if (hasClass(target, 'pika-select')) {
          if (!target.onchange) {
            target.setAttribute('onchange', 'return;');
            addEvent(target, 'change', self._onChange);
          }
        }

        do {
          if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
            return;
          }
        } while ((pEl = pEl.parentNode));

        if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
          self.hide();
        }
      };

      self.el = document.createElement('paper-material');
      self.el.elevation = 2;
      self.el.style.backgroundColor = 'white';
      self.el.style.position = 'absolute';
      self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '');

      addEvent(self.el, 'ontouchend' in document ? 'touchend' : 'mousedown', self._onMouseDown, true);
      addEvent(self.el, 'change', self._onChange);

      addEvent(opts.field, 'keyup', function (e) {
        // нажатие таб - скрывает страницу
        if (e.keyCode === 9) {
          self.hideElem(document.querySelector('.pika-single'));
          return;
        }

        // обработчик Enter на форме input
        // Сохранение date
        if (e.keyCode === 13) {
          let date = Pikaday.convertStringToDate(e.target.value);
          self.setDate(date);
        }

      });

      if (opts.field) {

        if (opts.container) {
          opts.container.appendChild(self.el);
        } else if (opts.bound) {
          document.body.appendChild(self.el);
        } else {
          opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
        }

        addEvent(opts.field, 'change', self._onInputChange);

        if (!opts.defaultDate) {
          opts.defaultDate = new Date(Date.parse(opts.field.value));
          opts.setDefaultDate = true;
        }

      }

      let defDate = opts.defaultDate;

      if (isDate(defDate)) {
        if (opts.setDefaultDate) {
          self.setDate(defDate, true);
        } else {
          self.gotoDate(defDate);
        }
      } else {
        self.gotoDate(new Date());
      }

      if (opts.bound) {
        this.hide();
        addEvent(opts.trigger, 'click', self._onInputClick);
        addEvent(opts.trigger, 'focus', self._onInputFocus);
        addEvent(opts.trigger, 'blur', self._onInputBlur);
      } else {
        this.show();
      }
    };


  /**
   * public Pikaday API
   * ******************************************
   */
  Pikaday.prototype = {

    /**
     * configure functionality
     */
    config: function (options) {
      if (!this._o) {
        this._o = extend({}, defaults, true);
      }

      let opts = extend(this._o, options, true);

      opts.isRTL = !!opts.isRTL;

      opts.field = (opts.field && opts.field.nodeName) ?
        opts.field :
        null;

      opts.bound = !!(opts.bound !== undefined ?
        opts.field && opts.bound :
          opts.field
      );

      opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

      opts.disableWeekends = !!opts.disableWeekends;

      opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;

      let nom = parseInt(opts.numberOfMonths, 10) || 1;
      opts.numberOfMonths = nom > 4 ? 4 : nom;

      if (!isDate(opts.minDate)) {
        opts.minDate = false;
      }
      if (!isDate(opts.maxDate)) {
        opts.maxDate = false;
      }
      if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
        opts.maxDate = opts.minDate = false;
      }
      if (opts.minDate) {
        this.setMinDate(opts.minDate);
      }
      if (opts.maxDate) {
        opts.maxYear = opts.maxDate.getFullYear();
        opts.maxMonth = opts.maxDate.getMonth();
      }

      if (isArray(opts.yearRange)) {
        let fallback = new Date().getFullYear() - 10;
        opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
        opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
      } else {
        opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
        if (opts.yearRange > 100) {
          opts.yearRange = 100;
        }
      }

      return opts;
    },

    /**
     * return a formatted string of the current selection (using Moment.js if available)
     */
    toString: function () {
      return Pikaday.toFormatDate(this._d);
    },

    /**
     * return a Date object of the current selection
     */
    getDate: function () {
      return isDate(this._d) ? new Date(this._d.getTime()) : null;
    },

    /**
     * set the current selection
     */
    setDate: function (date, preventOnSelect) {
      if (!date) {
        this._d = null;

        if (this._o.field) {
          this._o.field.value = '';
          fireEvent(this._o.field, 'change', {firedBy: this});
        }

        return this.draw();
      }

      if (typeof date === 'string') {
        date = new Date(Date.parse(date));
      }

      if (!isDate(date)) {
        return;
      }

      var min = this._o.minDate,
        max = this._o.maxDate;

      if (isDate(min) && date < min) {
        date = min;
      } else if (isDate(max) && date > max) {
        date = max;
      }

      this._d = new Date(date.getTime());

      this.gotoDate(this._d);
      this.setFieldFormat();

      if (preventOnSelect) {
      }

    },

    setFieldFormat: function () {

      if (this.getDate() === null) {
        return false;
      }

      // Move to refresh method
      if (this._o.field) {
        this._o.field.value = this.toString();
        fireEvent(this._o.field, 'change', {firedBy: this});
      }

      if (typeof this._o.onSelect === 'function') {
        this._o.onSelect.call(this, this.getDate());
      }
    },

    /**
     * change view to a specific date
     */
    gotoDate: function (date) {
      var newCalendar = true;

      if (!isDate(date)) {
        return;
      }

      if (this.calendars) {
        var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
          lastVisibleDate = new Date(this.calendars[this.calendars.length - 1].year, this.calendars[this.calendars.length - 1].month, 1),
          visibleDate = date.getTime();
        // get the end of the month
        lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
        lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
        newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
      }

      //if (newCalendar) {
      // Init calendars
      this.calendars = [{
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        month: date.getMonth(),
        year: date.getFullYear()
      }];
      if (this._o.mainCalendar === 'right') {
        this.calendars[0].month += 1 - this._o.numberOfMonths;
      }
      //}

      this.adjustCalendars();
    },

    adjustCalendars: function () {
      this.calendars[0] = adjustCalendar(this.calendars[0]);
      for (let c = 1; c < this._o.numberOfMonths; c++) {
        this.calendars[c] = adjustCalendar({
          month: this.calendars[0].month + c,
          year: this.calendars[0].year
        });
      }
      this.draw();
    },

    gotoToday: function () {
      this.gotoDate(new Date());
    },

    /**
     * change view to a specific month (zero-index, e.g. 0: January)
     */
    gotoMonth: function (month) {
      if (!isNaN(month)) {
        this.calendars[0].month = parseInt(month, 10);
        this.adjustCalendars();
      }
    },

    nextMonth: function () {
      this.calendars[0].month++;
      this.adjustCalendars();
    },

    prevMonth: function () {
      this.calendars[0].month--;
      this.adjustCalendars();
    },

    /**
     * change view to a specific full year (e.g. "2012")
     */
    gotoYear: function (year) {
      if (!isNaN(year)) {
        this.calendars[0].year = parseInt(year, 10);
        this.adjustCalendars();
      }
    },

    /**
     * change the minDate
     */
    setMinDate: function (value) {
      this._o.minDate = value;
      this._o.minYear = value.getFullYear();
      this._o.minMonth = value.getMonth();
    },

    /**
     * change the maxDate
     */
    setMaxDate: function (value) {
      this._o.maxDate = value;
    },

    setStartRange: function (value) {
      this._o.startRange = value;
    },

    setEndRange: function (value) {
      this._o.endRange = value;
    },

    /**
     * Кнопка ставящее текущее время
     * @returns {Element}
     */
    nowButton: function () {
      var self = this;
      let btn = document.createElement('paper-icon-button');
      btn.icon = 'restore';
      btn.title = 'Установить текущее время';
      btn.className = 'nowBtn';

      btn.onclick = function () {
        let now = new Date();
        self.setDate(now);
      };

      return btn;
    },

    /**
     * refresh the HTML
     */
    draw: function (force) {
      if (!this._v && !force) {
        return;
      }

      var opts = this._o,
        minYear = opts.minYear,
        maxYear = opts.maxYear,
        minMonth = opts.minMonth,
        maxMonth = opts.maxMonth,
        html = '';

      var self = this;

      if (this._y <= minYear) {
        this._y = minYear;
        if (!isNaN(minMonth) && this._m < minMonth) {
          this._m = minMonth;
        }
      }
      if (this._y >= maxYear) {
        this._y = maxYear;
        if (!isNaN(maxMonth) && this._m > maxMonth) {
          this._m = maxMonth;
        }
      }

      for (let c = 0; c < opts.numberOfMonths; c++) {
        let cDate = this.calendars[c];

        //Записываем выборку по часам и минутам
        html += '<div class="pika-lendar">' +
          renderTitle(this, c, cDate.year, cDate.month, this.calendars[0].year) +
          this.render(cDate.year, cDate.month, cDate.hour, cDate.minute) +
          '<div class="footer">' + renderHours(this, cDate.hour) + renderMinutes(this, cDate.minute) + '</div>' +
          '</div>';
      }

      this.el.innerHTML = html;
      this.el.querySelector('.footer').appendChild(this.nowButton());

      if (opts.bound) {
        if (opts.field.type !== 'hidden') {
          sto(function () {
            opts.trigger.focus();
          }, 1);
        }
      }

      if (typeof this._o.onDraw === 'function') {
        sto(function () {
          self._o.onDraw.call(self);
        }, 0);
      }

    },

    /**
     * Установка позиции по левому краю инпута
     */
    adjustPosition: function () {
      let field = this._o.trigger;
      let clientRect = field.getBoundingClientRect();

      let left = clientRect.left - clientRect.width / 2 - field.offsetWidth;
      let top = clientRect.bottom - clientRect.height - field.offsetHeight;

      this.el.style.left = `${left}px`;
      this.el.style.top = `${top}px`;
    },

    isToday: function (a, b) {
      a.setHours(0);
      a.setMinutes(0);
      a.setSeconds(0);
      a.setMilliseconds(0);
      b.setHours(0);
      b.setMinutes(0);
      b.setSeconds(0);
      b.setMilliseconds(0);

      return a.getTime() === b.getTime();
    },

    /**
     * render HTML for a particular month
     */
    render: function (year, month, hh, mm) {
      var opts = this._o,
        now = new Date(),
        days = getDaysInMonth(year, month),
        before = new Date(year, month, 1).getDay(),
        data = [],
        row = [];

      if (opts.firstDay > 0) {
        before -= opts.firstDay;
        if (before < 0) {
          before += 7;
        }
      }

      let cells = days + before,
        after = cells;

      while (after > 7) {
        after -= 7;
      }

      cells += 7 - after;
      for (let i = 0, r = 0; i < cells; i++) {
        let day = new Date(year, month, 1 + (i - before), hh, mm),
          isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
          isToday = this.isToday(day, now),
          isEmpty = i < before || i >= (days + before),
          isStartRange = opts.startRange && compareDates(opts.startRange, day),
          isEndRange = opts.endRange && compareDates(opts.endRange, day),
          isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
          isDisabled = (opts.minDate && day < opts.minDate) ||
            (opts.maxDate && day > opts.maxDate) ||
            (opts.disableWeekends && isWeekend(day)) ||
            (opts.disableDayFn && opts.disableDayFn(day)),
          dayConfig = {
            day: 1 + (i - before),
            month: month,
            year: year,
            isSelected: isSelected,
            isToday: isToday,
            isDisabled: isDisabled,
            isEmpty: isEmpty,
            isStartRange: isStartRange,
            isEndRange: isEndRange,
            isInRange: isInRange
          };

        row.push(renderDay(dayConfig));

        if (++r === 7) {
          if (opts.showWeekNumber) {
            row.unshift(renderWeek(i - before, month, year));
          }
          data.push(renderRow(row, opts.isRTL));
          row = [];
          r = 0;
        }
      }

      return renderTable(opts, data);
    },

    show: function () {
      this.el.hidden = false;
      if (!this._v) {
        removeClass(this.el, 'is-hidden');
        this._v = true;
        this.draw();
        if (this._o.bound) {
          addEvent(document, 'click', this._onClick);
          this.adjustPosition();
        }
        if (typeof this._o.onOpen === 'function') {
          this._o.onOpen.call(this);
        }
      }
    },

    hide: function () {
      if (this._v !== false) {
        if (this._o.bound) {
          removeEvent(document, 'click', this._onClick);
        }
        addClass(this.el, 'is-hidden');
        this._v = false;
        if (typeof this._o.onClose === 'function') {
          this._o.onClose.call(this);
        }
      }
    },

    hideElem: function (elem) {
      elem.hidden = true;
    },

    /**
     * DESTROY CALENDAR
     */
    destroy: function () {
      this.hide();
      removeEvent(this.el, 'mousedown', this._onMouseDown, true);
      removeEvent(this.el, 'change', this._onChange);
      if (this._o.field) {
        removeEvent(this._o.field, 'change', this._onInputChange);
        if (this._o.bound) {
          removeEvent(this._o.trigger, 'click', this._onInputClick);
          removeEvent(this._o.trigger, 'focus', this._onInputFocus);
          removeEvent(this._o.trigger, 'blur', this._onInputBlur);
        }
      }
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }

  };

  /**
   * Static Helpers
   * *******************************************************
   */

  /**
   * Конвертация в ДД.ММ.ГГГГ ЧЧ:ММ
   * @param date
   * @returns {*}
   */
  Pikaday.toFormatDate = function (date) {
    if (!(date instanceof Date)) {
      throw 'date is not a Date';
    }

    if (isNaN(date.getDate())) {
      throw 'date is NaN';
    }

    let dd = date.getDate();
    dd = (dd < 10) ?
    '0' + dd :
      dd;

    let month = date.getMonth() + 1;
    month = (month < 10) ?
    '0' + month :
      month;

    let yyyy = date.getFullYear();

    let hh = date.getHours();
    hh = (hh < 10) ?
    '0' + hh :
      hh;

    let mm = date.getMinutes();
    mm = (mm < 10) ?
    '0' + mm :
      mm;

    return `${dd}.${month}.${yyyy} ${hh}:${mm}`;

  };

  /**
   * Конвертация строк в дату
   * @param str
   * @returns {Date}
   */
  Pikaday.convertStringToDate = function (str) {
    let dd = str.slice(0, 2) - 0;
    let month = str.slice(3, 5) - 1;
    let yyyy = str.slice(6, 10) - 0;
    let hh = str.slice(11, 13) - 0;
    let mm = str.slice(14, 16) - 0;

    return new Date(yyyy, month, dd, hh, mm);
  };

  window.Pikaday = Pikaday;

  return Pikaday;

}(window, window.document, window.setTimeout));
