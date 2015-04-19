var twentyFourHoursLabels = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00", "23:00"];

function fetchStats(name) {
    return $.getJSON("http://mrjrp.com:7081/stats/" + name)
}

String.prototype.ucwords = function () {
    return this.toString().replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
        return $1.toUpperCase();
    });
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
                legend: {position: 'top', textStyle:{color: 'white'}},
                aggregationTarget: 'series',
                backgroundColor: { fill: 'transparent'},
                hAxis: { baselineColor: 'white', textStyle:{color: 'white'}},
                vAxis: { baselineColor: 'white', textStyle:{color: 'white'}},
                height: 250
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
                legend: 'none',
                backgroundColor: {fill: 'transparent'},
                height: 250
            };

            var chart = new google.visualization.PieChart(canvas);

            chart.draw(data, options);
        });
    },

    playbackUsage: function (canvas, $root) {
        var today = fetchStats('playback-usage'),
            lastWeek = fetchStats('playback-usage-minus-7'),
            unwrapData = function (row) {
                return row.map(function (r) {
                    num = parseFloat(r.c[3], 10);
                    if (isNaN(num))
                        num = false;

                    return [
                        parseInt(r.c[0], 10),
                        num
                    ]
                });
            },
            data = new google.visualization.DataTable();
            data.addColumn('timeofday', 'Hour');
            data.addColumn({
                type: 'number',
                label: 'Today',
                pattern: '##%'
            });
            data.addColumn({
                type: 'number',
                label: 'Last Week',
                pattern: '##%'
            });

        $.when(today, lastWeek).then(function (todayResult, lastWeekResult) {
            var total = 0,
                count = 0,
                average = 0,
                set1 = unwrapData(todayResult[0].stats);
                set2 = unwrapData(lastWeekResult[0].stats);

            set1.forEach(function (r, i) {
                var today = r[1],
                    lastWeek = set2[i][1],
                    hour = [r[0], 0,0,0];

                if (today === false) {
                    today = 0;
                } else {
                    total += today;
                    count++;
                }

                if (lastWeek === false)
                    lastWeek = 0;

                data.addRow([hour, today * 100, lastWeek * 100]);
            });

            var formatter = new google.visualization.NumberFormat({
                fractionDigits: 2,
                suffix: '%'
            });
            formatter.format(data, 1);
            formatter.format(data, 2);

            var chart = new google.visualization.LineChart(canvas);
            var options = {
                legend: {position: 'top', textStyle:{color: 'white'}},
                aggregationTarget: 'series',
                backgroundColor: { fill: 'transparent' },
                hAxis: { baselineColor: 'white', textStyle:{color: 'white'}},
                vAxis: { baselineColor: 'white', textStyle:{color: 'white'}, format: '#\'%\''},
                height: 250
            };
            chart.draw(data, options);

            average = total / count;
            $root.find('.average').text((average * 100).toFixed(0) + '%');
        });
    },

    signedIn: function (canvas, $root) {
        var today = fetchStats('signed-in'),
            lastWeek = fetchStats('signed-in-minus-7'),
            clean = function (raw, type) {
                return raw.filter(function (r) {
                    return r.c[1] !== "Total"
                }).filter(function (r) {
                    return r.c[0] === type
                });
            },
            formatRow = function (rows) {
                return rows.map(function (r, i) {
                    return [
                        parseInt(r.c[1], 10),
                        parseInt(r.c[2], 10)
                    ]
                });
            },
            getSigned = function (raw, signed) {
                return formatRow(clean(raw, "1"));
            },
            getAnon = function (raw, signed) {
                return formatRow(clean(raw, "N/A"));
            },
            sortByHour = function (a, b) {
                if (a[0] === b[0])
                    return 0;
                if (a[0] < b[0])
                    return -1;
                else
                    return 1;
            },
            data = new google.visualization.DataTable();
            data.addColumn('timeofday', 'Hour')
            data.addColumn({
                type: 'number',
                label: 'Today',
                pattern: '##.##%'
            });
            data.addColumn({
                type: 'number',
                label: 'Last Week',
                pattern: '##.##%'
            });

        $.when(today, lastWeek).then(function (todayResult, lastWeekResult) {
            var anonToday      = getAnon(todayResult[0].stats).sort(sortByHour),
                signedToday    = getSigned(todayResult[0].stats).sort(sortByHour),
                anonLastWeek   = getAnon(lastWeekResult[0].stats).sort(sortByHour),
                signedLastWeek = getSigned(lastWeekResult[0].stats).sort(sortByHour),
                getVal = function (blob, i) {
                    if (i in blob)
                        return blob[i][1];
                    else
                        return 0;
                }

            data.addRows(Array.apply(null, Array(24)).map(function (x, i) {
                return [
                    [i,0,0,0],
                    (getVal(signedToday, i) / (getVal(signedToday, i) + getVal(anonToday, i))) * 100,
                    (getVal(signedLastWeek, i) / (getVal(signedLastWeek, i) + getVal(anonLastWeek, i))) * 100
                ]
            }));

            var formatter = new google.visualization.NumberFormat({
                fractionDigits: 2,
                suffix: '%'
            });
            formatter.format(data, 1);
            formatter.format(data, 2);

            var chart = new google.visualization.LineChart(canvas);
            var options = {
                legend: {position: 'top', textStyle:{color: 'white'}},
                aggregationTarget: 'series',
                backgroundColor: { fill: 'transparent' },
                vAxis: {
                    format: '#.##\'%\''
                },
                hAxis: { baselineColor: 'white', textStyle:{color: 'white'}},
                vAxis: { baselineColor: 'white', textStyle:{color: 'white'}},
                height: 250
            };
            chart.draw(data, options);
        });
    },
    timeBetween: function (canvas, $root) {
        fetchStats('time-between-visits').then (function (stats) {
            var data = new google.visualization.DataTable();
            data.addColumn({
                type: 'number',
                label: 'Users'
            });
            data.addColumn({
                type: 'number',
                label: 'Hours'
            });

            var total = 0,
                never = 0,
                under1 = 0;

            stats.stats.forEach(function (r, i) {
                var num = parseInt(r.c[1], 10);
                if (r.c[0].substr(0, 4) === 'Non-') {
                    never = num;
                } else if (r.c[0].substr(0,3) === ' 0h') {
                    under1 = num;
                } else {
                    data.addRow([parseInt(r.c[0].substr(0,2), 10), num]);
                }
                total += num;
            });

            var chart = new google.charts.Bar(canvas),
                options = {
                    legend: { position: 'none'},
                    hAxis: { gridlines: {count: 10}},
                    backgroundColor: {fill: 'transparent'},
                    height: 250
                },
                neverPerc = ((never / (total + never)) * 100).toFixed(0)
                under1Perc = ((under1 / (total + under1)) * 100).toFixed(0)

            chart.draw(data, options);

            $root.find('.never').text(neverPerc + '%');
            $root.find('.under1').text(under1Perc + '%');
        });
    },
    searchTerms: function (canvas, $root) {
        fetchStats('search-terms').then (function (all) {
            var highest = 1,
                sortBySearches = function (a, b) {
                    if (a[2] === b[2])
                        return 0;
                    if (a[2] > b[2])
                        return -1;
                    else
                        return 1;
                }

            all.stats.filter(function (x) {
                return x.c[0] !== "Total"
            }).forEach(function (x) {
                highest = Math.max(parseInt(x.c[0], 10), highest);
            });

            var terms = {},
                totalSearches = 1;

            all.stats.filter(function (r) {
                return parseInt(r.c[0], 10) === highest -1;
            }).map(function (r) {
                var term = r.c[1].toLowerCase(),
                    val = parseInt(r.c[2], 10);

                if (term === 'total') {
                    totalSearches = val;
                } else if (term === 'rest') {

                } else if (term in terms) {
                    terms[term] += val;
                } else {
                    terms[term] = val;
                }
            });

            var rows = [];

            for (i in terms) {
                var perc = terms[i] / (terms[i] + totalSearches);
                rows.push([i, perc, terms[i]]);
            }

            var html = rows.sort(sortBySearches).slice(0, 10).map(function (r) {
                return '<li>' + r[0].ucwords() + ' - ' + r[1].toFixed(2) * 100 + '%' + ' - ' + r[2] + '</li>';
            });
            $(canvas).html('<ul>' + html.join('\n') + '</ul>')
        });
    },
    vistsPerUb: function (canvas) {
        fetchStats('vists-per-ub').then (function (stats) {
            var data = new google.visualization.DataTable();
            data.addColumn({
                type: 'number',
                label: 'Visits'
            });
            data.addColumn({
                type: 'number',
                label: 'Users'
            });

            stats.stats.sort(function (a, b) {
                a = parseInt(a.c[0], 10);
                b = parseInt(b.c[0], 10);
                if (a === b)
                    return 0
                if (a > b){
                    return 1
                } else {
                    return -1
                }
            }).slice(0, 7).forEach(function (r, i) {
                data.addRow([parseInt(r.c[0], 10), parseInt(r.c[1])]);
            });

            var chart = new google.charts.Bar(canvas);
            var options = {
                    legend: { position: 'none', textStyle: {color:'pink'}},
                    backgroundColor: 'transparent',
                    height: 250,
            };

            chart.draw(data, options);
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

