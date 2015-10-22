'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Request = require('../../src/Request')
const http = require('http')
const File = require('../../src/File')
const https = require('https')
const supertest = require('co-supertest')
const pem = require('pem')
const formidable = require('formidable')

require('co-mocha')

describe('Request', function () {

  it('should get request query string', function * () {

    const server = http.createServer(function (req, res) {

      const request = new Request(req, res)
      const query = request.get()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({query}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({name:"foo"})

  })

  it('should return empty object when request does not have query string', function * () {

    const server = http.createServer(function (req, res) {

      const request = new Request(req, res)
      const query = request.get()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({query}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({})

  })

  it('should get request post data', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {name:"foo"}
      const request = new Request(req, res)
      const body = request.post()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({body}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({name:"foo"})
  })

  it('should return empty object when post body does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const body = request.post()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({body}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({})
  })

  it('should get value for a given key using input method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const name = request.input("name")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.name).to.equal("foo")
  })

  it('should return null when value for input key is not available', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const name = request.input("name")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal(null)

  })

  it('should return get and post values when using all', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res)
      const all = request.all()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({name:"foo",age:22})
  })

  it('should return all headers for a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const headers = request.headers()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({headers}),'utf8')
    })

    const res = yield supertest(server).get("/").set('username','admin').expect(200).end()
    expect(res.body.headers).to.have.property("username")
    expect(res.body.headers.username).to.equal("admin")
  })

  it('should return header value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const username = request.header("username")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({username}),'utf8')
    })

    const res = yield supertest(server).get("/").set('username','admin').expect(200).end()
    expect(res.body.username).to.equal("admin")
  })

  it('should check for request freshness', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const fresh = request.fresh()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({fresh}),'utf8')
    })

    const res = yield supertest(server).get("/").set('if-none-match','*').expect(200).end()
    expect(res.body.fresh).to.equal(true)
  })

  it('should tell whether request is stale or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const stale = request.stale()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({stale}),'utf8')
    })

    const res = yield supertest(server).get("/").set('if-none-match','*').expect(200).end()
    expect(res.body.stale).to.equal(false)
  })

  it('should return best match for request ip address', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const ip = request.ip()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ip}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.ip).to.match(/127\.0\.0\.1/)
  })

  it('should return all ip addresses from a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const ips = request.ips()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ips}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.ips).to.be.an('array')
  })

  it('should tell whether request is https or not', function (done) {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    pem.createCertificate({days:1, selfSigned:true}, function(err, keys){

      const server = https.createServer({key: keys.serviceKey, cert: keys.certificate},function (req, res) {
        const request = new Request(req, res)
        const secure = request.secure()
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({secure}),'utf8')
      }).listen(3000)

      supertest('https://localhost:3000')
      .get("/")
      .expect(200)
      .end(function (err, res){
        if(err){
          done(err)
          return
        }
        expect(res.body.secure).to.equal(true)
        done()
      })
    });
  })

  it('should return request subdomains', function * () {
    const request = new Request({url:'http://virk.abc.com'}, {})
    const subdomains = request.subdomains()
    expect(subdomains).deep.equal(['virk'])
  })

  it('should tell whether request is ajax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const ajax = request.ajax()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ajax}),'utf8')
    })

    const res = yield supertest(server).get("/").set('X-Requested-With','xmlhttprequest').expect(200).end()
    expect(res.body.ajax).to.equal(true)
  })

  it('should tell whether request is pjax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const pjax = request.pjax()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({pjax}),'utf8')
    })

    const res = yield supertest(server).get("/").set('X-PJAX',true).expect(200).end()
    expect(res.body.pjax).to.equal(true)
  })

  it('should return request host name', function * () {

    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const hostname = request.hostname()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({hostname}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.hostname).to.equal(null)
  })


  it('should return request url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const url = request.url()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({url}),'utf8')
    })

    const res = yield supertest(server).get("/?query=string").expect(200).end()
    expect(res.body.url).to.equal('/')
  })

  it('should return request original url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const originalUrl = request.originalUrl()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({originalUrl}),'utf8')
    })

    const res = yield supertest(server).get("/?query=string").expect(200).end()
    expect(res.body.originalUrl).to.equal('/?query=string')
  })

  it('should return request method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const method = request.method()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({method}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.method).to.equal('GET')
  })

  it('should tell whether request is of certain type', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const isHtml = request.is('html')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({isHtml}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Content-type','text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell best response type request will accept', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const html = request.accepts('html')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({html}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Accepts','text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should return request cookies', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const cookies = request.cookies()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({cookies}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name:"foo"})
  })

  it('should not reparse cookies after calling cookies method multiple times', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const cookies = request.cookies()
      request.cookiesObject["age"] = 22
      const cookiesAgain = request.cookies()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({cookies:cookiesAgain}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name:"foo",age:22})
  })

  it('should return cookie value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const name = request.cookie('name')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.name).to.equal("foo")
  })

  it('should return null when cookie value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const age = request.cookie('age')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({age}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.age).to.equal(null)
  })

  it('should return route params', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      request._params = {id:1}
      const params = request.params()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({params}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.params).deep.equal({id:1})
  })

  it('should return empty object when request params does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      const params = request.params()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({params}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.params).deep.equal({})
  })

  it('should return request param value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      request._params = {id:1}
      const id = request.param('id')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({id}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.id).to.equal(1)
  })

  it('should return request null when param value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res)
      request._params = {id:1}
      const name = request.param('name')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal(null)
  })

  it('should return an uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({file:file instanceof File}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").attach('logo',__dirname+'/uploads/npm-logo.svg').expect(200).end()
    expect(res.body.file).to.equal(true)
  })

  it('should return an empty file instance when file is not uploaded', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({exists:file.exists()}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.exists).to.equal(false)
  })

  it('should return all uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const allFiles = request.files()
        const isInstances = []
        allFiles.forEach(function (file) {
          isInstances.push(file instanceof File)
        })
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({isInstances}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").attach('logo',__dirname+'/uploads/npm-logo.svg').attach('favicon',__dirname+'/public/favicon.ico').expect(200).end()
    expect(res.body.isInstances).deep.equal([true,true])
  })

})
