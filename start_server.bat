@echo off
echo ========================================================
echo   تشغيل خادم محلي لنظام ساس العوائل السعودية (Port 8000)
echo ========================================================
echo جاري بدء الخادم على http://localhost:8000 ...
start "" "http://localhost:8000/index.html"
python -m http.server 8000
pause
