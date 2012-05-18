var sys = require('sys')
  , dgram = require('dgram')
  , socket = dgram.createSocket('udp4')
  , timers = require('timers');

function average(array) {
    var value = 0,
        length = array.length;
    for (var i = 0; i < length; ++i) {
        value += array[i];
    }
    return value/length;
}

Client = function (host, port, ms) {
    var self = this;
    self.host = host;
    self.port = port;
    self.ms = ms;
    self.data = {
        "gauges": {},
        "timings": {},
        "inc": {}
    };

    timers.setInterval(function() {
        var stats = {};
        for (gauge in self.data.gauges) {
            stats[gauge] = average(self.data.gauges[gauge]) + "|g";
        }
        for (timing in self.data.timings) {
            stats[timing] = average(self.data.timings[timing]) + "|ms";
        }
        for (inc in self.data.inc) {
            stats[inc] = self.data.inc[inc] + "|c";
        }
        self.send(stats);
        self.data = {
            "gauges": {},
            "timings": {},
            "inc": {}
        };
    }, self.ms);
}

Client.prototype.timing = function (name, value) {
    var self = this;
    self.save("timings", name, value);
};

Client.prototype.gauge = function (name, value) {
    var self = this;
    self.save("gauges", name, value);
};

Client.prototype.increment = function (name) {
    var self = this;
    self.save("inc", name, 1);
}

Client.prototype.decrement = function (name) {
    var self = this;
    self.save("inc", name, -1);
}

Client.prototype.save = function(kind, name, value) {
    var self = this;
    if(!self.data[kind]) {
        self.data[kind] = {};
    }

    if (kind === "inc") {
        if(!self.data[kind][name]) {
            self.data[kind][name] = 0;
        }

        self.data[kind][name] += value;
    } else {     
        if(!self.data[kind][name]) {
            self.data[kind][name] = new Array();
        }
        self.data[kind][name].push(value);
    }
}

Client.prototype.send = function (data) {
    var self = this;

    console.log(JSON.stringify(stats));
    for (stat in data) {
        var send_data = stat+":"+data[stat];
        send_data = new Buffer(send_data);

        socket.send(send_data, 0, send_data.length, self.port, self.host,
            function (err, bytes) {
                if (err) {
                    console.log(err.msg);
                }
            }
        );
    }
};

exports.StatsD = Client;
