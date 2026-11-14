' GateHub launcher: starts the local server (hidden) if needed, then opens
' http://localhost:5173 as its own Chrome app window using your normal Chrome
' profile, so your GATE Wallah / Claude logins and GateHub progress persist.
Option Explicit
Dim fso, sh, here, url, chrome, c, candidates, py, pys, i
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
here = fso.GetParentFolderName(WScript.ScriptFullName)
url  = "http://localhost:5173/"

Function ServerUp()
  Dim http, st
  ServerUp = False
  st = 0
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 500, 500, 800, 800
  http.Open "GET", "http://127.0.0.1:5173/manifest.webmanifest", False
  http.Send
  st = http.Status
  On Error GoTo 0
  If st = 200 Then ServerUp = True
End Function

If Not ServerUp() Then
  pys = Array( _
    sh.ExpandEnvironmentStrings("%LocalAppData%") & "\Programs\Python\Python313\pythonw.exe", _
    sh.ExpandEnvironmentStrings("%LocalAppData%") & "\Programs\Python\Launcher\pyw.exe", _
    sh.ExpandEnvironmentStrings("%SystemRoot%") & "\pyw.exe")
  py = ""
  For Each c In pys
    If py = "" And fso.FileExists(c) Then py = c
  Next
  If py = "" Then
    MsgBox "GateHub needs Python to run its local server. Install Python from python.org and try again.", 48, "GateHub"
    WScript.Quit 1
  End If
  sh.CurrentDirectory = here
  sh.Run """" & py & """ """ & here & "\server.py""", 0, False
  For i = 1 To 30
    WScript.Sleep 200
    If ServerUp() Then Exit For
  Next
End If

candidates = Array( _
  sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe", _
  sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe", _
  sh.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe")
chrome = ""
For Each c In candidates
  If chrome = "" And fso.FileExists(c) Then chrome = c
Next

If chrome <> "" Then
  sh.Run """" & chrome & """ --app=" & url & " --start-maximized", 1, False
Else
  sh.Run url, 1, False
End If
