import portalConfig from '../portal.config'

export default function App() {
  return (
    <main>
      <h1>SALN Tracker: {portalConfig.provinceName}</h1>
      <footer>{portalConfig.disclaimer}</footer>
    </main>
  )
}
