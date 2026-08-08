# 파일: start.sh
#!/usr/bin/env bash
set -euo pipefail

java -jar Lavalink.jar

# 일시정지 대체 (터미널에서만)
if [ -t 0 ]; then
  echo
  read -n1 -r -p "Press any key to continue..." || true
  echo
fi
