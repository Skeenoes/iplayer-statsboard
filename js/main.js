var twentyFourHoursLabels = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00", "23:00"];

function fetchStats(name) {
    return $.getJSON("http://mrjrp.com:7081/stats/" + name)
}

var charts = {
    ubsPerHour: function (canvas, $root) {

        var today = fetchStats('ub-per-hour'),
            lastWeek = fetchStats('ub-per-hour-minus-7');

        var unwrapData = function (raw) {
            return raw.filter(function (r) {
                return r.c[0] !== "Total"
            }).map(function (r) {
                return r.c
            });
        }

        $.when(today, lastWeek).then(function (todayResult, lastWeekResult) {
            var set1 = unwrapData(todayResult[0].stats),
                set2 = unwrapData(lastWeekResult[0].stats),
                data = new google.visualization.DataTable();

            data.addColumn('timeofday', 'Hour');
            data.addColumn('number', 'Today');
            data.addColumn('number', 'Last Week');

            set1.forEach(function (r, i) {
                var column1 = parseFloat(r[1], 10),
                    column2 = parseFloat(set2[i][1], 10),
                    hour = [parseInt(r[0], 10), 0,0,0]

                data.addRow([hour, column1, column2]);
            });

            var chart = new google.visualization.LineChart(canvas);
            var options = {
                legend: {position: 'top'},
                aggregationTarget: 'series',
                backgroundColor: { fill: 'transparent' }
            };
            chart.draw(data, options);
        });
    },
    platformSplit: function (canvas, $root) {
        var unwrapData = function (raw) {
            return
        };

        fetchStats('platform-usage').then(function (resp) {
            var dataArray = resp.stats.filter(function (r) {
                return r.c[0] !== "Total"
            }).map(function (r) {
                return [
                    r.c[0],
                    parseFloat(r.c[1],10)
                ]
            });
            dataArray.unshift(['Platform', 'Usage']);

            var data = google.visualization.arrayToDataTable(dataArray);
            var options = {
                pieSliceText: 'label',
                legend: 'none'
            };

            var chart = new google.visualization.PieChart(canvas);

            chart.draw(data, options);
        });
    },

    playbackUsage: function (canvas, $root) {
        var data = new google.visualization.DataTable();

            data.addColumn('timeofday', 'Hour');
            data.addColumn({
                type: 'number',
                label: 'Conversion',
                pattern: '##%'
            });

        fetchStats('playback-usage').then(function (resp) {
            var total = 0,
                count = 0,
                average = 0,
                set1 = [];

            resp.stats.forEach(function (r, i) {
                var num = parseFloat(r.c[3], 10),
                    hour = [parseInt(r.c[0],10), 0,0,0];

                if (isNaN(num)) {
                    num = 0;
                } else {
                    total += num;
                    count++;
                }

                    data.addRow([hour, num * 100]);
            });

            var formatter = new google.visualization.NumberFormat({
                fractionDigits: 2,
                suffix: '%'
            });
            formatter.format(data, 1);

            var chart = new google.visualization.LineChart(canvas);
            var options = {
                legend: {position: 'top'},
                aggregationTarget: 'series',
                backgroundColor: { fill: 'transparent' },
                vAxis: {
                    format: '#\'%\''
                }
            };
            chart.draw(data, options);

            average = total / count;
            $root.find('.average').text((average * 100).toFixed(0) + '%');
        });
    }
}

google.setOnLoadCallback(function () {;
    $('.stats-chart').each(function (i, ele) {
        var $root = $(ele)
            chart = $root.data('chart');

        if ($root.is('.canvas')) {
            canvas = ele;
        } else {
            canvas = $root.find('.canvas').get(0);
        }

        charts[chart](canvas, $root);
    });
});

