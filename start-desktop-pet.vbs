Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "C:\Users\sweet\codex-projects\desktop-pet"
shell.Run "cmd /c npm.cmd start", 0, False
