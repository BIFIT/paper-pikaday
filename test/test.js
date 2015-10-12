suite('<paper-pikaday>', function () {
  var pikaday;
  var document;

  setup(function () {
    pikaday = fixture('ElementPikaday');
    document = window.document;
  });

  /**
   * Открытие датапикера
   */
  test('openDatePicker', function (done) {
    pikaday.addEventListener('click', function () {
      var containerPikaLendar = document.querySelectorAll('.pika-lendar');

      expect(containerPikaLendar).to.exist;

      MockInteractions.tap(document.body);
      done();
    });

    MockInteractions.tap(pikaday.getElementsByTagName('input')[0]);

  });

  /**
   * Существование поля ввода
   */
  test('pikaday.field', function (done) {
    expect(pikaday.field).to.exist;

    done();
  });
  /**
   * Проверка на соответствие текущего времени
   */
  test('pikaday.date', function (done) {
    var date = pikaday.properties.date();
    expect(date).to.eql(Date());

    done();
  });

});
