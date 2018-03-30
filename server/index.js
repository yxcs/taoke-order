const fs = require('fs');
const http = require('http');
const needle = require('needle');
const md5 = require('blueimp-md5');
const XLSX = require('xlsx');

// let alimamaTaokeUrl = 'http://10.8.85.36:8080/taoke/alimama/order/import';
let alimamaTaokeUrl = 'http://qf-bos.mdscj.com/taoke/alimama/order/import';
// let taokeStatUrl = 'http://10.8.85.36:8080/taoke/stat/import';
let taokeStatUrl = 'http://qf-bos.mdscj.com/taoke/stat/import';
let stateInUse = false;
let payload = '';
let accountNo = null;
let accessToken = null;
let updateTbkTimeLog = Date.now();
let updateStateTimeLog = Date.now();
let taokeTask = {};
let alimamaStatus = 'RUNNING';
let stateStatus = 'RUNNING';
let warningApi = 'http://open.xuanwonainiu.com/message/plugin/alert';

fs.readFile('./account.txt', (err, data) => {
  if (err) {
    fs.appendFileSync(
      './.log',
      'read account file failed: ' + err.message + '\r\n'
    );
  } else {
    console.log('获取账号成功：' + data.toString());
  }
  accountNo = data.toString().trim();
  startWatch();
});

function startWatch () {
  fs.watch('./', (eventType, filename) => {
    try {
      var timer = new Date().getHours();
      filename && fs.access(filename, (err) => {
        if (!err) {

          // for taoke orders
          if (/^TaokeDetail.*\.xls$/.test(filename) ||
          /^TaokeIsvDetail.*\.xls$/.test(filename)) {
            console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 文件路径: ${filename} 事件类型${eventType}`);
            console.dir(taokeTask)
            if (!taokeTask[filename]) {
              taokeTask[filename] = {
                status: 'init'
              };
              if (filename.indexOf('TaokeDetail') !== -1) {
                console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  开始上传淘客订单----`);
              } else if (filename.indexOf('TaokeIsvDetail') !== -1) {
                console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  开始上传第三方服务商推广订单----`);
              }
              taokeTask[filename].status = 'interactive';

              // 首先判断该文件是否还在
              fs.exists(`./${filename}`, function(isExists) {
                if(isExists) {
                  needle.post(
                    alimamaTaokeUrl,
                    {
                      file: {
                        file: `./${filename}`,
                        content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                      },
                      accessToken: md5(`${new Date().getDate()}d2gr2b42y4b4vfubr455`),
                      accountNo
                    },
                    {multipart: true, read_timeout: 0, open_timeout: 0},
                    (err, resp, body) => {
                      console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  返回数据----`);
                      console.log('err:')
                      console.log(err);
                      console.log('body:')
                      console.log(body);
                      taokeTask[filename].status = 'finished';
                      if (!err) {
                        if (body && body.status === 1) {
                          if (body.data) {
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传淘客订单文件成功！\r\n`
                            );
                            alimamaStatus = 'RUNNING';

                            // 文件已经上传成功，更新记录时间
                            updateTbkTimeLog = Date.now();

                            // 更新成功之后才删除文件
                            // 删除开始之前，看此次更新了多少条数据
                            let workExcel = XLSX.readFile(`./${filename}`);
                            let workSheet = workExcel.Sheets[workExcel.SheetNames[0]];
                            let count = 1;
                            while (workSheet[`A${count}`]) {
                              count++;
                            }
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 此次成功上传${count - 1}条订单记录\r\n`
                            );
                            console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 此次成功上传${count - 1}条订单记录\r\n`)
                            // 每天10和22点进行 数据表保存
                            fs.exists(`./${filename}`, function(isExists) {
                              if(isExists) {
                                fs.unlink(`./${filename}`, (err) => {
                                  if (err) {
                                    console.log('删除文件出错');
                                    console.log(err.msg);
                                  }
                                  delete taokeTask[filename];
                                });
                              }
                            });
                          } else {
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传淘客订单文件失败：${body.msg}\r\n`
                            );
                            delete taokeTask[filename];
                          }
                        } else {
                          fs.appendFileSync(
                            './.log',
                            `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传淘客订单文件失败：请求失败！\r\n`
                          );
                          delete taokeTask[filename];
                        }
                      } else {
                        fs.appendFileSync(
                          './.log',
                          `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传淘客订单文件失败！\r\n${err.message}`
                        );
                        delete taokeTask[filename];
                      }
                      delete taokeTask[filename]
                    }
                  );
                }
              })
            }
          } else if (/^productEffect.*\.xls$/.test(filename)) {
            console.log('文件路径：' + filename);
            if (!stateInUse) {
              stateInUse = true;

              fs.exists(`./${filename}`, function(isExists) {
                if(isExists) {
                  // 文件下载成功
                  console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  开始上传推广数据----`);
                  needle.post(
                    taokeStatUrl,
                    {
                      file: {
                        file: `./${filename}`,
                        content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                      },
                      accessToken: md5(`${new Date().getDate()}d2gr2b42y4b4vfubr455`),
                      accountNo
                    },
                    {multipart: true, read_timeout: 0, open_timeout: 0},
                      (err, resp, body) => {
                      console.log(`----${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  返回数据----`);
                      console.log(body);
                      if (!err) {
                        if (body && body.status === 1) {
                          if (body.data) {
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传推广记录文件成功！\r\n`
                            );
                            stateStatus = 'RUNNING';
                            // 文件已经上传成功，更新记录时间
                            updateStateTimeLog = Date.now();
                            // 删除开始之前，看此次更新了多少条数据
                            let workExcel = XLSX.readFile(`./${filename}`);
                            let workSheet = workExcel.Sheets[workExcel.SheetNames[0]];
                            let count = 1;
                            while (workSheet[`A${count}`]) {
                              count++;
                            }
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 此次成功上传${count - 1}条推广记录\r\n`
                            );
                            console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 此次成功上传${count - 1}条推广记录\r\n`)
                            fs.exists(`./${filename}`, function(isExists) {
                              if(isExists) {
                                fs.unlink(`./${filename}`, (err) => {
                                  if (err) {
                                    console.log('删除文件出错');
                                    console.log(err.msg);
                                  }
                                });
                              }
                            });
                          } else {
                            fs.appendFileSync(
                              './.log',
                              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传推广记录文件失败：${body.msg}\r\n`
                            );
                          }
                        } else {
                          fs.appendFileSync(
                            './.log',
                            `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上传推广记录文件失败：请求失败！\r\n`
                          );
                        }
                      } else {
                        fs.appendFileSync(
                          './.log',
                          `上传推广数据出错\r\n${err.message}\r\n`
                        );
                      }
                      stateInUse = false;
                    }
                  );
                } else {
                  stateInUse = false;
                }
              })
            }
          }else if(/^TaokeRefundDetailReport.*\.xls$/.test(filename)) {

            // stateInUse should be changed
            if (!stateInUse) {
              stateInUse = true;
              // 每天10和22点进行 数据表保存
              fs.unlink(`./${filename}`, (err) => {
                if (err) {
                  console.log('删除文件出错');
                  console.log(err.msg);
                }
              });
              stateInUse = false;
            }else {
              stateInUse = false;
            }
          }
        }
      });
    } catch (err) {
      console.trace(err);
      console.log('exception occurs')
    }
  })
}

// 监控，30分钟没有文件变更，则认为插件异常
let watcherId = setInterval(() => {

  // 首次异常开始报警，避免多次异常导致频繁调用接口
  if (Date.now() - updateStateTimeLog > 60 * 1000 * 90 && stateStatus === 'RUNNING') {
    stateStatus = 'FORBIDDEN';
    // 推广异常
    needle.post(
      `${warningApi}`,
      {
        account: `${accountNo}[PC:]#爬取推广数据`
      },
      (err, resp, body) => {
        if (!err) {
          if (body.status.errorCode === 200) {
            fs.appendFileSync(
              './.log',
              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上报错误成功！\r\n`
            );
          } else {
            fs.appendFileSync(
              './.log',
              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上报错误失败！\r\n`
            );
          }
        } else {
          fs.appendFile(
            './.log',
            err.message
          );
        }
      }
    );
  }
  if (Date.now() - updateTbkTimeLog > 60 * 1000 * 30 && alimamaStatus === 'RUNNING') {
    alimamaStatus = 'FORBIDDEN';

    // 淘客订单异常
    needle.post(
      `${warningApi}`,
      {
        account: `${accountNo}[PC:]#爬取淘客订单`
      },
      (err, resp, body) => {
        if (!err) {
          if (body.status.errorCode === 200) {
            fs.appendFileSync(
              './.log',
              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上报错误成功！\r\n`
            );
          } else {
            fs.appendFileSync(
              './.log',
              `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} 上报错误失败！\r\n`
            );
          }
        } else {
          fs.appendFileSync('./.log', err.message);
        }
      }
    );
  }

}, 60 * 1000 * 5);

process.on('uncaughtException', err => {
  console.trace(err)
  stateInUse = false;
})
