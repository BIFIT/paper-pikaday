'use strict';
new Polymer({
  is: 'paper-pikaday',

  _maskPattern: '99.99.9999 99:99',
  _placeholder: 'ДД.ММ.ГГГГ чч:мм',

  field: null,
  properties: {
    id: String,

    from: {
      type: String
    },
    to: {
      type: String
    },

    date: Date
  },

  /**
   * Клик на число
   * @param {Date} date
   */
  onSelect: function (date) {
    this.date = date;
    this.field.value = window.Pikaday.toFormatDate(date);
  },

  ready: function () {
    let field = this.field = this.$$('#' + this.id);
    let maskField = this.$['input-mask'];

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

    let minDate = new Date(0);
    if (this.from) {
      minDate = new Date(this.from);
    }

    let maxDate = new Date();
    if (this.to) {
      maxDate = new Date(this.to);
    }

    try {
      //debugger;
      new window.Pikaday({
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
      console.error(e);
    }

    try {
      window.VMasker(field).maskPattern(this._maskPattern);
    } catch (e) {
      console.error(e);
    }

  }

});
