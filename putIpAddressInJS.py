import sys
import subprocess

#interface = "eth0"
interface = "wlan6"

script = "ifconfig " + interface + " | grep -i 'inet ' | awk '{print $2}'"
scriptResult = subprocess.check_output(script, shell=True)
ipAddress = scriptResult.split(":")[1].replace('\n', '').replace('\r', '')

if len(sys.argv) == 2:
	fileName = sys.argv[1]
	searchExpression = "var socketaddyLocal"		
	replacement = "var socketaddyLocal= \"ws://" + ipAddress + ":9001\";\n"
	
	
	fileHandle = open(fileName, "r+")		
	lines = fileHandle.readlines()
	fileHandle.seek(0)
	for line in lines:
		if searchExpression in line:
			line = replacement
			print replacement
		fileHandle.write(line)
		if line == replacement:
			break
	
