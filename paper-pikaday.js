'use strict';
Polymer({
  is: 'paper-pikaday',

  _maskPattern: '99.99.9999 99:99',
  _placeholder: 'ДД.ММ.ГГГГ чч:мм',

  field: null,
  properties: {
    minDate: Date,
    maxDate: Date,
    date: Date,
    id: String
  },

  ready: function () {
    var self = this;
    var field = this.field = this.$$('#' + this.id);
    var maskField = this.$['input-mask'];

    field.maxLength = maskField.maxLength = this._maskPattern.length;

    var placeholder = '';
    for (var i = 0; i < this._maskPattern.length; i++) {
      var val = this._maskPattern[i];
      if (val.search(/\D/)) {
        placeholder += ' ';
      } else {
        placeholder += val;
      }
    }
    field.placeholder = this._placeholder;
    maskField.placeholder = placeholder;

    var minDate = this.minDate || new Date(2015, 0, 1);
    var currentDate = this.maxDate || new Date();

    if (!window.hasOwnProperty('Pikaday')) {
      throw 'Pikaday is not ready';
    }
    new Pikaday({
      field: field,
      showWeekNumber: true,
      firstDay: 1,
      numberOfMonths: 1,
      minDate: minDate,
      maxDate: currentDate,
      yearRange: [minDate.getFullYear(), currentDate.getFullYear()],

      onSelect: function (date) {
        self.date = date;
        self.field.value = Pikaday.toFormatDate(date);
      }
    });

    if (!window.hasOwnProperty('VMasker')) {
      throw 'VMasker is not ready';
    }
    VMasker(field).maskPattern(this._maskPattern);

  }

});
