[System.Void](npm list -g typescript); if ($LASTEXITCODE -ne 0 -or -not $?) {
   npm install -g typescript
}

tsc --watch