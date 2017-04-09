var http = require('http');
var https = require('https');

var path = require('path');
var url = require('url');

var fs = require('fs');
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
//connect

// main declare parameter
//
// checkFilePath then save
var saving = checkFilePath(saveFile());
//
//go crawl and defined response data callback
var processing = goCrawl('over18=1', function(url, res, body) {
    var $ = cheerio.load(body);
    console.log('Status:' + res.statusCode);
    saving(getFileName(url, res.statusCode), body)
    if (res.statusCode == 302) {
        console.log('302 crawl again');
        $('a').map(function(aTag) {
            processing(aTag.attr('href'));
        });
    }
    $('a').each(function(index,aTag) {
        console.log($(this).attr('href'));
    });
    // var wholeChunk = '';
    // res.setEncoding('binary');
    // res.on('data', function(chunk) {
    //     wholeChunk += chunk;
    // });
    // res.on('end', function(chunk) {
    //     var data = encode(wholeChunk);
    //     //saving(getFileName(url, res.statusCode), encode(wholeChunk));
    //     testGetElement(data);
    //     if (res.statusCode === 302) {
    //         console.log('302 crawl again');
    //         processing(findhref(wholeChunk));
    //     }
    // });
});

// main process function
processing(process.argv[2]);


//test function
function testGetElement(data) {
    var parser = new DOMParser();
    var html = parser.parseFromString(data, "text/html");
    var elArr = html.getElementsByTagName('a');
}

// functions
var getUrl = function(str) {
    if (!str) {
        console.log("no path !");
        process.exit();
    } else {
        return str;
    }
}

function goCrawl(setCookie, fn) {
    var cookie = setCookie;
    var callback = fn;
    return function(link) {
        if (!link) {
            return;
        }
        var urlObj = url.parse(link);
        console.log(urlObj);
        if (!urlObj.hostname) {
            return;
        }
        request({
            url: link,
            headers: { 'Cookie': cookie },
            encoding: null
        }, function(err, res, body) {
            //body if setencode null return buffer
            if (err || !body) {
                return;
            }
            fn(urlObj.hostname, res, body);
        });


        //     var req = https.request({
        //         hostname: urlObj.hostname,
        //         path: urlObj.path,
        //         method: 'GET',
        //         headers: { 'Cookie': cookie }
        //     }, function(res) {
        //         callback(res, urlObj.path);
        //     });

        //     req.on('error', (e) => {
        //         console.log(`problem with request: ${e.message}`);
        //     });
        //     req.end();

    };
}

function getFileName(path, status, code) {
    var filename = '';
    var str = path.replace(/www/g, '').replace(/\//g, '_').replace(/\./g, '_').replace('html', '');
    switch (code) {
        case 0:
            //ptt
            filename = 'ptt_' + str.replace('/bbs/', '');
            break;
        default:
            filename = 'web_' + str;
    }
    return "./crawledFile/" + status + filename + ".html";
}


function checkFilePath(fn) {
    var callback = fn;
    return function(filepath, body) {
        fs.access(filepath, (err) => {
            if (!err) {
                console.error('File already exists');
                fs.unlink(filepath, function(err) {
                    if (!err) {
                        console.log("unlink file : " + filepath);
                        callback(filepath, body);
                    } else {
                        console.log("unlink Err : " + err);
                    }
                });
                return;
            }
            callback(filepath, body);
        });
    }
}

function saveFile(coding) {
    var code = coding;
    return function(filepath, data) {
        console.log("save File : " + filepath);
        // fs.appendFile(filepath, data, function(err) {
        //     if (err) {
        //         console.log("save file err");
        //     } else {
        //         console.log('saved!');
        //     }
        // });
        fs.appendFileSync(filepath, encode(data, code));
    }

}

// use regexp filter data to find href
// function findhref(data) {
//     var regex = /<[a|A].*?[HREF|href]\s*=\s*["|'](.*?)["|']/;
//     var realdata = data.toString('utf-8');
//     var result = realdata.match(regex);
//     if (result && result.length >= 1) {
//         return result[1];
//     } else {
//         console.log('no result');
//         process.exit();
//     }
// }

function encode(chunk, coding) {
    //turn binary to buffer
    //trun buffer to utf-8
    coding = coding || 'utf-8';
    var buf = new Buffer(chunk, 'binary');
    var data = iconv.decode(buf, coding);
    return data;
}

function compose(f, g, h) {
    return function(x) {
        return f(g(h(x)));
    };
}
