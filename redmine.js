/*
 * Copyright (c) 2015, Utix SAS <contact@utix.fr>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 */


/* Munin set configuration into env :
 * API_key
 * Hostname
 *
 */
var http = require('http');
var querystring = require('querystring');
var options = {
    hostname: process.env.hostname,
    port: 80,
    url: '/issues.json',
    method: 'GET',
    headers: {
        'X-Redmine-API-Key': process.env.API_key
    }
};
var issues = {};

function _get_issues(offset, limit, callback, end) {
    options.path  = options.url + "?" + querystring.stringify({offset: offset, limit:limit});

    var req = http.request(options, function(res) {
        var _data = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            _data += chunk;

        });
        res.on('end', function() {
            var data = JSON.parse(_data);
            var done = data.offset + data.limit < data.total_count;
            if (!done) {
                /* use data.limit as limit, server can clip our limit */
                _get_issues(data.offset + data.limit, data.limit, callback);
            }
            data.issues.forEach(function(issue) {
                callback(issue);
            });
            if (done) {
                end();
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
}
/* callback will be call for each issues */
function get_issues(issue_callback, end_callback) {
    _get_issues(0, 0, issue_callback, end_callback);
}


get_issues(function(issue) {
    issues[issue.id] = issue;
},
function(){
    console.log(issues);
});
