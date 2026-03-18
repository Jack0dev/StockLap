@REM
@REM Maven Wrapper startup batch script
@REM

@IF "%__MVNW_ARG0__%"=="" SET __MVNW_ARG0__=%~dpnx0
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0'; $distributionUrl=(Get-Content -Raw \"$scriptDir\.mvn\wrapper\maven-wrapper.properties\" | Select-String 'distributionUrl=(.*)').Matches[0].Groups[1].Value.Trim(); $wrapperJar=\"$scriptDir\.mvn\wrapper\maven-wrapper.jar\"; if (Test-Path $wrapperJar) { Write-Output \"MVNW_CMD=java -jar \`\"$wrapperJar\`\" $distributionUrl\" } else { Write-Output \"MVNW_ERROR=Cannot find maven-wrapper.jar\" }}"`) DO @SET "%%A%%B"
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%

@IF NOT "%__MVNW_ERROR__%"=="" (
  @ECHO %__MVNW_ERROR__%
  @EXIT /B 1
)

@%__MVNW_CMD__% %*
