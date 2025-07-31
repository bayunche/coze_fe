// Welcome 页面工具函数

export const startAnimation = () => {
  // 启动欢迎页面动画
  console.log('Welcome animation started')
}

export const navigateToFeature = (featureId, router) => {
  const routes = {
    contract: '/home',
    material: '/smart-brain/material-management'
  }
  
  if (routes[featureId]) {
    router.push(routes[featureId])
  }
}