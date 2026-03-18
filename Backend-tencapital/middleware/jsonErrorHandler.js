// Middleware pour gérer les erreurs de parsing JSON
const jsonErrorHandler = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [JSON Parse Error]:', {
      message: error.message,
      url: req.url,
      method: req.method,
      headers: req.headers['content-type'],
      bodyLength: req.body ? JSON.stringify(req.body).length : 0,
      rawBody: req.body
    });
    
    // Diagnostic plus détaillé
    let diagnostic = 'Unknown JSON error';
    if (error.message.includes('Unexpected end of JSON input')) {
      diagnostic = 'Empty or incomplete JSON body';
    } else if (error.message.includes('Unexpected token')) {
      diagnostic = 'Invalid JSON syntax or characters';
    } else if (error.message.includes('Unexpected string in JSON')) {
      diagnostic = 'Invalid string format in JSON';
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: 'JSON parsing failed',
      details: {
        expected: 'Valid JSON format',
        received: diagnostic,
        suggestion: 'Check your request body format and Content-Type header',
        contentType: req.headers['content-type'] || 'Not specified',
        bodyLength: req.body ? JSON.stringify(req.body).length : 0
      }
    });
  }
  
  // Si c'est une erreur de limite de taille
  if (error.type === 'entity.too.large') {
    console.error('❌ [Request Too Large]:', {
      message: error.message,
      url: req.url,
      method: req.method
    });
    
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      error: 'Request body exceeds size limit',
      details: {
        limit: '10MB',
        suggestion: 'Reduce the size of your request body'
      }
    });
  }
  
  next(error);
};

module.exports = jsonErrorHandler;
