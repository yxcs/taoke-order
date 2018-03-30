function modifyResponse(response) {

    var original_response, modified_response;

    if (this.readyState === 4) {
        // 使用在 openBypass 中保存的相关参数判断是否需要修改
        if (this.requestURL.includes('request_nick_check.do')) {
            original_response = response.target.responseText;
            Object.defineProperty(this, "responseText", {writable: true});
            // 根据 sendBypass 中保存的数据修改响应内容
            this.responseText = JSON.stringify({"needcode": true});
        }
        if (this.requestURL.includes('analyze.jsonp') &&
            response.target.responseText.indexOf('"code":300') !== -1) {
            original_response = response.target.responseText.replace(/jsonp_\d+\(/, '').replace(')', '');
            Object.defineProperty(this, 'responseText', {writable: true});
            this.responseText = original_response.replace('"code":300', '"code":0').replace('"value":"block', '"value":"3245456345"')
        }
    }
}

function openBypass(original_function) {

    return function(method, url, async) {
        // 保存请求相关参数
        this.requestMethod = method;
        this.requestURL = url;

        this.addEventListener("readystatechange", modifyResponse);
        return original_function.apply(this, arguments);
    };

}

function sendBypass(original_function) {
    return function(data) {
        // 保存请求相关参数
        this.requestData = data;
        return original_function.apply(this, arguments);
    };
}

XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
XMLHttpRequest.prototype.send = sendBypass(XMLHttpRequest.prototype.send);

// http://alisec.alimama.com/checkcodev3.php?v=4&ip=123.207.183.208&sign=fcb78a1ab9c2cbf27b0810c3893ccaeb&app=union-pub&how=%E8%8E%B7%E5%8F%96%E6%8E%A8%E5%B9%BF%E8%AE%A2%E5%8D%95%E6%98%8E%E7%BB%86&http_referer=http://pub.alimama.com/myunion.htm?spm=a219t.7900221/1.1998910419.dbb742793.566efeb0O3bbUe?#!/report/detail/extra
//
//
//
//
// jsonp_048263314060764007({"result":{"value":"block","code":300,"csessionid":"013mhI2RS3M-l67WI2m-uNo6HhIPUNLxAzfsUKwzI4b8JVXK7J85C2TdfThyovn-jfzmvFvH8dHsXeYul2hNaqVmVhyH2vPaWHvudajOVTIdB1eeZtDFf8F8VXUaeR2Ng5MWOqppg1XjDQ9wgUgjvGXNpE2HtcI16LQn_uYF5S7cRu5o4a69PdVYj92lkdPloB77Bi-APBz09OGV7dWF_8Nsx3OQ73gV5XtBYwx5DGBQFmub5RTcIKKKCpFj_mpUbDcQ4siDi1Zn5cp8Bzh81GaQhpFl_Sjmztu23CZXwiJcOTIv9lDtj8jSGxnWF3be14UEyuAKDokXC1kXHN788hScKvhpX6LDb--Hg8_GDLZo1UY-d5pdNqJRUvcrHYbYz6jeqKav7-D_D6beZbicTilg"},"success":true});