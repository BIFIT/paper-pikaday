(function (window) {
  'use strict';

  const Pikaday = window.Pikaday;
  const VMasker = window.VMasker;

  new Polymer({
    is: 'paper-pikaday',

    _maskPattern: '99.99.9999 99:99',
    _placeholder: 'ДД.ММ.ГГГГ чч:мм',

    _field: null,
    _vMasker: null,
    _pikaday: null,

    properties: {
      id: String,

      from: String,
      until: String,

      date: Date
    },

    get field() {
      return this._field;
    },

    /**
     * Клик на число
     * @param {Date} date
     */
      onSelect(date) {
      this.date = date;
      this._field.value = Pikaday.toFormatDate(date);
    },

    /**
     * Открыть датапикер
     */
      showDatePicker() {
      this._pikaday.show();
    },

    /**
     * Заполнение плейсхолдера
     * @param field {Node}
     */
      _setPlaceholder(field) {
      let maskField = this.$.inputMask;

      field.maxLength = maskField.maxLength = this._maskPattern.length;

      let placeholder = '';
      for (let i = 0; i < maskField.maxLength; i++) {
        let patternValue = this._maskPattern[i];
        if (patternValue.search(/\D/)) {
          placeholder += ' ';
        } else {
          placeholder += patternValue;
        }
      }
      field.placeholder = this._placeholder;
      maskField.placeholder = placeholder;
    },

    _getDefaultDates() {
      let minDate = new Date(0);
      if (this.from) {
        minDate = new Date(this.from);
      }

      let maxDate = new Date();
      if (this.until) {
        maxDate = new Date(this.until);
      }

      return {
        minDate,
        maxDate
      };
    },

    /**
     * Загрузка Pikaday
     * @param field {Node}
     */
      _loadPikaday(field) {
      let defaultDates = this._getDefaultDates();
      let minDate = defaultDates.minDate;
      let maxDate = defaultDates.maxDate;

      try {
        return new Pikaday({
          field,
          showWeekNumber: true,
          firstDay: 1,
          numberOfMonths: 1,
          minDate,
          maxDate,
          yearRange: [minDate.getFullYear(), maxDate.getFullYear()],
          container: this.parentElement,
          onSelect: this.onSelect.bind(this)
        });
      } catch (e) {
        return null;
      }
    },

    /**
     * Загрузка vMasker
     * @param field {Node}
     */
      _loadVMasker(field) {
      try {
        return new VMasker(field).maskPattern(this._maskPattern);
      } catch (e) {
        return null;
      }
    },

    ready() {
      let field = this._field = this.$$('#' + this.id);

      this._setPlaceholder(field);

      this._pikaday = this._loadPikaday(field);
      this._vMasker = this._loadVMasker(field);
    }

  });

}(window));