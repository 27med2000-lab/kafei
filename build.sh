#!/bin/sh
cd /home/user/kafei/v3/parts && cat a.html js1.js views.js js2.js js3.js js4.js js5.js > ../index.html && cd .. && python3 - <<'P'
s=open('index.html').read()
i=s.index('<title>'); j=s.index('</style>')+8
open('site.html','w').write('<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+s[:j]+'\n</head>\n<body>\n'+s[j:]+'\n</body>\n</html>\n')
P
