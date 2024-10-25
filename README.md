# float-tools README

一个vscode插件，用于浮点数相关的各种格式之间的转换

## Extension User Guide
支持如下两种方式：
1. 鼠标放到需要转换的数字上
2. 选中需要转换的数字，`ctrl+shift+p` 然后选择命令 `float-tools.convertSelectNum`

目前支持格式如下:

* `0x12345678`
* `0x1.23p456`
* `1.23456e+7`
* `1.23456789`


## Release Notes

### 0.0.1
创建插件

### 0.0.2
修改描述

### 0.0.3
修改正则，修复`1.2345e6` 识别成 `1.2345` 问题

### 0.0.4
增加处理，可以将`-0x123` 作为 `0x123` 处理

### 0.0.5
增加整数类型显示，改变显示风格

### 0.0.6
增加默认汇编文件的支持

### 0.0.7
修复将整形识别成十六进制的错误

### 0.0.8
修复一些类型识别错误

## For more information

* [float-tools github](https://github.com/wjjahah/vscode-float-tools.git)

**Enjoy!**
