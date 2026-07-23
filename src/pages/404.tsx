export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-greyscale-600 mb-8">The page you are looking for does not exist.</p>
        <a href="/" className="btn btn-primary">
          Go back home
        </a>
      </div>
    </div>
  )
}