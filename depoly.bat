@echo off
setlocal enabledelayedexpansion

:: 定义源文件夹路径
set "SOURCE_DIR=dist"

:: 定义目标文件夹路径列表
set "TARGET_DIRS=D:\deploy\systems\XingPu-ui\dist D:\deploy\systems\XinJie-ui\dist D:\deploy\systems\XiHe-ui\dist D:\deploy\systems\AnKang-ui\dist"

:: 遍历目标文件夹列表
for %%T in (%TARGET_DIRS%) do (
    echo Copying to %%T...
    :: 复制文件到目标文件夹
    xcopy "%SOURCE_DIR%\*" "%%T" /E /I /Y
)

echo Done.
pause