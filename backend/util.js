function signAndSend(message, name, domain, req, res, targetDomain, inbox) {
    // get the private key
    let db = req.app.get('db');
    let inboxFragment = inbox.replace('https://'+targetDomain,'');
    let result = db.prepare('select privkey from accounts where name = ?').get(`${name}@${domain}`);
    if (result === undefined) {
      console.log(`No record found for ${name}.`);
    }
    else {
      let privkey = result.privkey;
      const digestHash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('base64');
      const signer = crypto.createSign('sha256');
      let d = new Date();
      let stringToSign = `(request-target): post ${inboxFragment}\nhost: ${targetDomain}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digestHash}`;
      signer.update(stringToSign);
      signer.end();
      const signature = signer.sign(privkey);
      const signature_b64 = signature.toString('base64');
      let header = `keyId="https://${domain}/u/${name}",headers="(request-target) host date digest",signature="${signature_b64}"`;
      request({
        url: inbox,
        headers: {
          'Host': targetDomain,
          'Date': d.toUTCString(),
          'Digest': `SHA-256=${digestHash}`,
          'Signature': header
        },
        method: 'POST',
        json: true,
        body: message
      }, function (error, response){
        console.log(`Sent message to an inbox at ${targetDomain}!`);
        if (error) {
          console.log('Error:', error, response);
        }
        else {
          console.log('Response Status Code:', response.statusCode);
        }
      });
    }
  }