import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Page Not Found</h1>
      <p>The link you opened does not exist in the AAIR application.</p>
      <Link className="button" to="/">Back to Home</Link>
    </main>
  )
}
