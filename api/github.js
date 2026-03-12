module.exports = async (req, res) => {
  // CORS configuration pour permettre l'appel depuis le front
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Gérer la requête préliminaire OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Vérification du Mot de Passe Administrateur via le Header
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: 'Mot de passe administrateur incorrect ou manquant.' });
  }

  // 2. Variables d'environnement pour GitHub
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    return res.status(500).json({ error: 'Erreur serveur: Token GitHub non configuré sur Vercel.' });
  }

  // Configuration du repository cible
  const OWNER = "EN7DESIGN"; 
  const REPO = "PlanBWebsite";
  const PATH = "data.json";
  const githubUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  try {
    // --- METHODE GET (Lire data.json) ---
    if (req.method === 'GET') {
      const response = await fetch(githubUrl, {
        headers: { 'Authorization': `token ${githubToken}` },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur GitHub API: ${response.statusText}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    }
    
    // --- METHODE PUT (Modifier data.json) ---
    if (req.method === 'PUT') {
      const { message, content, sha } = req.body;

      if (!message || !content || !sha) {
         return res.status(400).json({ error: 'Paramètres manquants dans la requête (message, content ou sha).' });
      }

      const response = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            content: content,
            sha: sha
        })
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(`Erreur GitHub API lors de la mise à jour: ${errorData.message}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // --- AUTRES METHODES ---
    return res.status(405).json({ error: 'Méthode non autorisée.' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
