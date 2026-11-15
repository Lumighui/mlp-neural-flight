# MLP 神经航班

一个用于解释多层感知机（MLP）前向传播过程的交互式静态网页。

## 内容

- 七站可交互前向传播演示
- 输入、权重、偏置、ReLU、Logit 与 Sigmoid 的逐步算式
- Canvas 绘制的动态神经网络与飞行路线
- 键盘控制、移动端布局与减少动态效果支持

## 本地预览

无需构建。直接打开 `index.html`，或在当前目录启动任意静态文件服务器：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## GitHub Pages

项目没有构建步骤和外部运行时依赖，可从仓库根目录直接发布。GitHub Pages 中选择
`Deploy from a branch`、分支 `main`、目录 `/ (root)` 即可。
