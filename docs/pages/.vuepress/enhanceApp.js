import markdown from 'markdown-it'
import Metrics from './helpers/Metrics'
import '../../styles/app.scss'

export default ({
  Vue,
  options,
  router,
  siteData
}) => {
    Vue.use(new Metrics())
    Vue.directive('markdown', {
        inserted: function (el, binding, vnode) {
            const text = binding.value || el.innerText || el.textContent
            el.innerHTML = markdown({
                breaks: true,
                typographer: true
            }).render(text)
        }
    })

}
