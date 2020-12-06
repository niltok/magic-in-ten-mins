const marked = require('marked')
const fs = require('fs')
const hljs = require('highlight.js')

if (fs.existsSync("html")) fs.rmdirSync("html", {
    recursive: true
})

fs.mkdirSync("html")

const $$ = label => s => '<' + label + '>\n' + s + '</' + label + '>\n'

const charset = '<meta charset="utf-8"/>\n'
const viewpoint = '<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=0">\n'
const title = $$('title')('十分钟魔法练习')

const hljscss = '<link href="https://cdn.bootcdn.net/ajax/libs/highlight.js/10.3.2/styles/a11y-light.min.css" rel="stylesheet">'
const materialize = '<link href="https://cdn.bootcdn.net/ajax/libs/materialize/1.0.0-rc.2/css/materialize.min.css" rel="stylesheet">'

const sbody = 'body { max-width: 650px; margin: auto; width: 90%; margin-top: 10%; margin-bottom: 10%; color: #0B0E26; background: #FAFAFF; }\n'
const sfont = 'body { font-family: -apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Microsoft YaHei,Source Han Sans SC,Noto Sans CJK SC,WenQuanYi Micro Hei,sans-serif; }\n'
const sh1 = 'h1 { font-size: 2.5em; color: #EF96AB; }\n'
const sh2 = 'h2 { margin-top: 2em; }\n'
const scenter = 'h1, h2, h3 { text-align: center; }\n'
const squote = 'blockquote { color: gray; margin: 0; padding: 1 1 1 20; border-left: 5px solid #EF96AB; }\n'
const scode = 'code { font-family: Consolas,Menlo,Monaco,source-code-pro,Courier New,monospace; background: #F2F0F0; }\n'
const spre = 'pre { overflow: scroll; padding: 10px; background: #F1F0F0; }\n'
const sscorll = '::-webkit-scrollbar, .element::-webkit-scrollbar, .element { display: none; }\n'
const sa = 'a { color: #02AEF1; text-decoration: none; }\n'

const hlkeyword = '.hljs-keyword { color: #F288AF; }\n'
const hlconmment = '.hljs-comment { color: #929CA6; }\n'
const hlstring = '.hljs-string { color: #0594A6; }\n'
const hltitle = '.hljs-title { color: #4581D9 }\n'

const hlcss = hlkeyword + hlconmment + hlstring + hltitle
const style = $$('style')(sbody + sfont + sh1 + sh2 + squote + scode + spre + sscorll + sa + hlcss)

const head = $$('head')(charset + viewpoint + title + style)

const gen = s => {
    return $$('html')(head + $$('body')(marked(s, {highlight: s => hljs.highlightAuto(s, ['java']).value})))
}

fs.readdirSync("doc").forEach(f => {
    if (f.endsWith(".md")){
        const content = fs.readFileSync("doc/" + f).toString()
        fs.writeFileSync("html/" + f.substr(0, f.length - 3) + ".html", gen(content))
    }
})

const index = fs.readFileSync('readme.md').toString()
fs.writeFileSync('index.html', gen(index))
