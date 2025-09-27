import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, TrendingUp, Database, Zap, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">RegressionPro</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Connexion</Link>
            </Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/auth">
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          Analyse statistique avancée
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Analysez vos données
          <br />
          avec précision
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Uploadez vos datasets, explorez les relations entre vos variables et générez des modèles de régression 
          avancés en quelques clics. Outil professionnel d'analyse statistique.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/auth">
              Commencer l'analyse
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            Voir la démo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Fonctionnalités avancées</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tous les outils dont vous avez besoin pour une analyse de régression complète
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <Database className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Multi-datasets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Importez et gérez plusieurs jeux de données simultanément. 
                Supports CSV, JSON, XLSX.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>6 modèles de régression</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Linéaire, polynomiale, exponentielle, logarithmique, 
                puissance et logistique.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Visualisations interactives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Graphiques dynamiques, scatter plots et courbes de régression 
                en temps réel.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Calculs instantanés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                R², MAE, MSE, RMSE et autres métriques statistiques 
                calculées automatiquement.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Données sécurisées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vos datasets sont stockés de manière sécurisée et 
                accessibles uniquement par vous.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="p-2 rounded-lg bg-gradient-primary w-fit">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Interface intuitive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Conçu pour les analystes, chercheurs et data scientists 
                de tous niveaux.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary">
        <div className="container mx-auto px-4 py-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à analyser vos données ?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez les professionnels qui font confiance à RegressionPro 
            pour leurs analyses statistiques
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">
              Créer un compte gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 RegressionPro. Outil d'analyse statistique professionnel.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;