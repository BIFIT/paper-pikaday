/**
 * Pikaday
 *
 * Copyright © 2015 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 * Copyright © 2015-2016 Denis Baskovsky (Changes)
 */
(function (window, document, sto) {
  'use strict';

  const MM = 'Минуты';
  const HH = 'Часы';

  /**
   * "03.02.2016 12:44"
   *  to
   * "02.03.2016 12:44"
   *
   * @param value
   * @return {String|Null}
   */
  function convertEngToRusDateValue(value) {

    try {
      let a = value.match(/^(\d+)/)[1];
      let b = value.match(/^\d+.(\d+)/)[1];
      let c = value.match(/^\d+.\d+.(\d+.+)/)[1];

      return `${b}.${a}.${c}`;
    } catch (e) {
      console.log(e);
    }

    return null;

  }

  let addEvent = function (el, e, callback, capture) {
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

    trim = (str) => {
      return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    hasClass = (el, cn) => {
      return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = (el, cn) => {
      if (!hasClass(el, cn)) {
        el.className = (el.className === '') ? cn : el.className + ' ' + cn;
      }
    },

    removeClass = (el, cn) => {
      el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    isArray = (obj) => {
      return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = (obj) => {
      return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isWeekend = (date) => {
      let day = date.getDay();

      return day === 0 || day === 6;
    },

    isLeapYear = (year) => {
      // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
      return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = (year, month) => {
      return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    compareDates = (a, b) => {
      return a.getTime() === b.getTime();
    },

    extend = (to, from, overwrite) => {
      let prop, hasProp;
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

    adjustCalendar = (calendar) => {
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
    renderDayName = (opts, day, abbr) => {
      day += opts.firstDay;
      while (day >= 7) {
        day -= 7;
      }

      return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = (opts) => {
      if (opts.isEmpty) {
        return `<td class="is-empty"></td>`;
      }

      let button = '<button type="button" class="pika-button pika-day" ';

      let arr = [];
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
      body += `
        <span class="drop-menu"><p>Часы</p>
        <paper-dropdown-menu label="${HH}" no-animations no-label-float>
        <paper-menu class="dropdown-content">
      `;

      // шаг в 2 часа
      for (let i = 0; i < 24; i += 2) {
        let text = i < 10 ?
          `0${i}` :
          i;

        body += `<paper-item>${text}</paper-item>`;
      }

      body += '</paper-menu></paper-dropdown-menu></span>';

      sto(() => {
        instance.setHH(hh);
      }, 0);

      return body;
    },

    renderMinutes = (instance, mm) => {
      let body = '';
      body += `
        <span class="drop-menu"><p>Минуты</p>
        <paper-dropdown-menu label="${MM}" no-animations no-label-float>
        <paper-menu class="dropdown-content">
      `;

      // шаг в 5 минут
      for (let i = 0; i < 60; i += 5) {
        const text = i < 10 ? '0' + i : i;

        body += '<paper-item>' + text + '</paper-item>';
      }

      body += '</paper-menu></paper-dropdown-menu></span>';

      sto(() => {
        instance.setMM(mm);
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

      return (html += '</div>');
    },

    renderTable = (opts, data) => {
      return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },

    hideDropdowns = (instance) => {
      let $pdm;

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

    /**
     * Pikaday constructor
     */
    Pikaday = function (options) {
      let self = this;
      let opts = self.config(options);

      self._onMouseDown = function (e) {
        if (!self._v) {
          return;
        }

        e = e || window.event;

        let target = e.target || e.srcElement;
        if (!target) {
          return;
        }

        if (target.getAttribute('data-pika-year')) {
          self._d = self.getFormatDate(this, target);
        }

        switch (target.tagName) {
          case 'PAPER-MATERIAL':
            return;

          // Если кликаем на выпадающий список - обновляем значения
          // и пропускаем обработчик закрытия окна
          case 'PAPER-ITEM':
          {


            let date = self.getFormatDate(this, null, self);
            let labelName = target.closest('[label]').getAttribute('label');
            let newVal = String(target.textContent);

            if (HH === labelName) {
              date.setHours(newVal);
              self.calendars[0].hour = newVal;
            } else if (MM === labelName) {
              date.setMinutes(newVal);
              self.calendars[0].minute = newVal;
            }

            self.setDate(date);
            self.setFieldFormat();

            return;
          }

          default:
            break;
        }

        if (!hasClass(target.parentNode, 'is-disabled')) {
          const paperBtn = target.closest('.pika-button');

          if (paperBtn && !paperBtn.classList.contains('is-empty')) {
            let formatDate = self.getFormatDate(this, paperBtn);
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

      self._onChange = (e) => {
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

      /**
       * При нажатии на Enter берем значения из текстового поля и вставляем в календарь
       * @param e
       * @private
       */
      self._onInputChange = (e) => {
        if (e.which !== 13) {
          return;
        }

        let newDate = moment(new Date(Date.parse(convertEngToRusDateValue(opts.field.value))));

        if (isDate(newDate)) {
          self.setDate(newDate);
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
        let target = e.target || e.srcElement;
        let pEl = target;

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


      let paperMaterial = document.createElement('paper-material');

      self.el = self._o.container.appendChild(paperMaterial);
      self.el.elevation = 2;
      self.el.style.backgroundColor = 'white';
      self.el.style.position = 'absolute';
      //self.el.style.overflow = 'hidden';
      self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '');

      addEvent(self.el,
        'ontouchend' in document ?
          'touchend' :
          'mousedown', self._onMouseDown,
        true);

      addEvent(self.el, 'change', self._onChange);

      addEvent(opts.field, 'keyup', (e) => {
        switch (e.keyCode) {
          // нажатие таб - скрывает страницу
          case 9:
          {
            self.hideElem(document.querySelector('.pika-single'));
            break;
          }

          // обработчик Enter на форме input
          // Сохранение date
          case 13:
          {
            let date = Pikaday.convertStringToDate(e.target.value);
            self.setDate(date);
            break;
          }
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

        addEvent(opts.field, 'keyup', self._onInputChange);

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

    getFormatDate (instance, target, self) {
      let hh, mm, yyyy, MM, dd;

      if (instance.tagName === 'PAPER-MATERIAL') {

        hh = this.getHH();
        mm = this.getMM();

        if (self && self.calendars) {
          let cDate = self.calendars[0];
          yyyy = cDate.year;
          MM = cDate.month;
          dd = cDate.day;
        }

      } else if (instance.el) {
        hh = this.getHH();
        mm = this.getMM();
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
     * configure functionality
     */
      config (options) {

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
      toString () {
      return Pikaday.toFormatDate(this._d);
    },

    /**
     * return a Date object of the current selection
     */
      getDate () {
      return isDate(this._d) ? new Date(this._d.getTime()) : null;
    },

    /**
     * set the current selection
     * @param date {Date}
     * @param noUpdate {Boolean|null} не обновлять время
     */
      setDate (date, noUpdate) {
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

      let min = this._o.minDate;
      let max = this._o.maxDate;

      if (isDate(min) && date < min) {
        date = min;
      } else if (isDate(max) && date > max) {
        date = max;
      }

      this._d = new Date(date.getTime());

      if (noUpdate) {
        return;
      }

      this.gotoDate(this._d);
      this.setFieldFormat();

    },

    /**
     *
     */
      setFieldFormat () {

      if (this.getDate() === null) {
        return;
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
     *
     * @return {Element|*|Node}
     */
    get getMMInput() {
      return this.el.querySelector(`[label="${MM}"] paper-input`);
    },

    /**
     *
     * @return {Element|*|Node}
     */
    get getHHInput() {
      return this.el.querySelector(`[label="${HH}"] paper-input`);
    },

    /**
     *
     */
      setMM (mm) {
      this.getMMInput.value = mm;
    },

    /**
     * @return {number}
     */
      getMM () {
      return Number.parseInt(this.getMMInput.value || 0.0);
    },

    setHH (hh) {
      this.getHHInput.value = hh;
    },

    /**
     * @return {number}
     */
      getHH () {
      return Number.parseInt(this.getHHInput.value || 0.0);
    },

    /**
     * change view to a specific date
     * @param date {Date}
     */
      gotoDate (date) {
      let newCalendar = true;

      if (!isDate(date)) {
        return;
      }

      if (this.calendars) {
        let firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1);
        let lastVisibleDate = new Date(this.calendars[this.calendars.length - 1].year, this.calendars[this.calendars.length - 1].month, 1);
        let visibleDate = date.getTime();
        // get the end of the month
        lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
        lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
        newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
      }

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

      this.adjustCalendars();
    },

    /**
     *
     */
      adjustCalendars () {
      this.calendars[0] = adjustCalendar(this.calendars[0]);

      for (let c = 1; c < this._o.numberOfMonths; c++) {
        this.calendars[c] = adjustCalendar({
          month: this.calendars[0].month + c,
          year: this.calendars[0].year
        });
      }

      this.draw();
    },

    /**
     *
     */
      gotoToday () {
      this.gotoDate(new Date());
    },

    /**
     * change view to a specific month (zero-index, e.g. 0: January)
     */
      gotoMonth (month) {
      if (!isNaN(month)) {
        this.calendars[0].month = parseInt(month, 10);
        this.adjustCalendars();
      }
    },

    /**
     *
     */
      nextMonth () {
      this.calendars[0].month++;
      this.adjustCalendars();
    },

    /**
     *
     */
      prevMonth () {
      this.calendars[0].month--;
      this.adjustCalendars();
    },

    /**
     * change view to a specific full year (e.g. "2012")
     * @year {String}
     */
      gotoYear (year) {
      if (!isNaN(year)) {
        this.calendars[0].year = parseInt(year, 10);
        this.adjustCalendars();
      }
    },

    /**
     * change the minDate
     * @param value {Object}
     */
      setMinDate (value) {
      this._o.minDate = value;
      this._o.minYear = value.getFullYear();
      this._o.minMonth = value.getMonth();
    },

    /**
     * change the maxDate
     */
      setMaxDate (value) {
      this._o.maxDate = value;
    },

    /**
     *
     */
      setStartRange (value) {
      this._o.startRange = value;
    },

    /**
     *
     */
      setEndRange (value) {
      this._o.endRange = value;
    },

    /**
     * Кнопка ставящее текущее время
     * @returns {Element}
     */
      nowButton () {

      const btn = document.createElement('paper-icon-button');
      btn.icon = 'restore';
      btn.title = 'Установить текущее время';
      btn.className = 'nowBtn';

      btn.style.float = 'right';
      btn.style.lineHeight = '3';

      btn.onclick = () => {
        const now = new Date();
        this.setDate(now);

        this.hide();
      };

      return btn;
    },

    /**
     * refresh the HTML
     */
      draw (force) {
      if (!this._v && !force) {
        return;
      }

      const el = this.el;

      // Show loading
      el.classList.add('loading');
      setTimeout(() => {
        el.classList.remove('loading');
      }, 0);

      let opts = this._o;
      let minYear = opts.minYear;
      let maxYear = opts.maxYear;
      let minMonth = opts.minMonth;
      let maxMonth = opts.maxMonth;
      let html = '';

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

      if (el.children.length > 0) {
        this.removeEl();
      }

      const node = document.createElement('div');
      node.innerHTML = html;

      el.appendChild(node);

      this._o.container.appendChild(el);

      const footer = el.querySelector('.footer');
      footer.appendChild(this.nowButton());

      if (opts.bound) {
        if (opts.field.type !== 'hidden') {
          sto(() => {
            opts.trigger.focus();
          }, 1);
        }
      }

      if (typeof this._o.onDraw === 'function') {
        sto(() => {
          this._o.onDraw.call(this);
        }, 0);
      }

    },

    /**
     * Установка позиции по левому краю инпута
     */
      adjustPosition () {
      let field = this._o.trigger;
      let clientRect = field.getBoundingClientRect();

      let left = clientRect.left - clientRect.width / 2 - field.offsetWidth;
      let top = clientRect.bottom - clientRect.height - field.offsetHeight;

      this.el.style.left = `${ left }px`;
      this.el.style.top = `${ top }px`;
    },

    /**
     * День сегодняшний
     * @param a {Date}
     * @param b {Date}
     * @return {Boolean}
     */
      isToday (a, b) {
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
     * Render HTML for a particular month
     */
      render (year, month, hh, mm) {
      const opts = this._o;
      const now = new Date();
      const days = getDaysInMonth(year, month);

      let before = new Date(year, month, 1).getDay();
      let data = [];
      let row = [];

      if (opts.firstDay > 0) {
        before -= opts.firstDay;
        if (before < 0) {
          before += 7;
        }
      }

      let cells = days + before;
      let after = cells;

      while (after > 7) {
        after -= 7;
      }

      cells += 7 - after;

      for (let i = 0, r = 0; i < cells; i++) {
        let day = new Date(year, month, 1 + (i - before), hh, mm);
        let isSelected = isDate(this._d) ? compareDates(day, this._d) : false;
        let isToday = this.isToday(day, now);
        let isEmpty = i < before || i >= (days + before);
        let isStartRange = opts.startRange && compareDates(opts.startRange, day);
        let isEndRange = opts.endRange && compareDates(opts.endRange, day);
        let isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange;
        let isDisabled = (opts.minDate && day < opts.minDate) ||
          (opts.maxDate && day > opts.maxDate) ||
          (opts.disableWeekends && isWeekend(day)) ||
          (opts.disableDayFn && opts.disableDayFn(day));

        const dayConfig = {
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

    /**
     *
     */
      show () {
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

    /**
     *
     */
      hide() {
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

    /**
     * Скрытие элемента
     */
      hideElem (elem) {
      elem.hidden = true;
    },

    /**
     * DESTROY CALENDAR
     */
      destroy () {
      this.hide();

      removeEvent(this.el, 'mousedown', this._onMouseDown, true);
      removeEvent(this.el, 'change', this._onChange, true);

      if (this._o.field) {
        removeEvent(this._o.field, 'keyup', this._onInputChange);
        if (this._o.bound) {
          removeEvent(this._o.trigger, 'click', this._onInputClick);
          removeEvent(this._o.trigger, 'focus', this._onInputFocus);
          removeEvent(this._o.trigger, 'blur', this._onInputBlur);
        }
      }

      this.removeEl();
    },

    /**
     * Удалить всех потомков
     */
      removeEl() {

      if (this.el.parentNode) {
        [].forEach.call(this.el.children, child => {
          child.parentNode.removeChild(child);
        });

        this.el.parentNode.removeChild(this.el);
      }

      // HACK: против загрузки ещё одного div
      if (this.el.children.length === 1) {
        let child = this.el.children[0];
        child.parentNode.removeChild(child);
      }
    }

  };

  /**
   * Static Helpers
   * *******************************************************
   */

  /**
   * Конвертация в ДД.ММ.ГГГГ ЧЧ:ММ
   * @param date {Date}
   * @returns {*}
   */
  Pikaday.toFormatDate = (date) => {
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
   * @param str {String}
   * @returns {Date}
   */
  Pikaday.convertStringToDate = (str) => {
    let dd = str.slice(0, 2) - 0;
    let month = str.slice(3, 5) - 1;
    let yyyy = str.slice(6, 10) - 0;
    let hh = str.slice(11, 13) - 0;
    let mm = str.slice(14, 16) - 0;

    return new Date(yyyy, month, dd, hh, mm);
  };

  return (window.Pikaday = Pikaday);

}(window, window.document, window.setTimeout));
