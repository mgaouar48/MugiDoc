import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Wifi, Server, Monitor, CheckCircle2, XCircle, Loader2,
  Copy, AlertTriangle, Info, Laptop
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getNetworkConfig, saveNetworkConfig, testNetworkConnection, NetworkConfig
} from '@/lib/networkClient';

export const NetworkSettingsSection = () => {
  const { toast } = useToast();

  const [config, setConfig] = useState<NetworkConfig>(getNetworkConfig());
  const [mode, setMode] = useState<'server' | 'client' | 'none'>('none');
  const [localIP, setLocalIP] = useState<string>('');
  const [serverToken, setServerToken] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'stopped' | 'running' | 'loading'>('stopped');
  const [clientStatus, setClientStatus] = useState<'disconnected' | 'connected' | 'testing'>('disconnected');
  const [clientIP, setClientIP] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  // Charger la configuration initiale
  useEffect(() => {
    const stored = getNetworkConfig();
    setConfig(stored);
    if (stored.enabled && stored.serverIP === 'server') {
      setMode('server');
    } else if (stored.enabled && stored.serverIP) {
      setMode('client');
      setClientIP(stored.serverIP);
      setClientToken(stored.token || '');
    }
  }, []);

  // Récupérer l'IP locale et le token du serveur depuis Electron
  useEffect(() => {
    if (isElectron) {
      window.electronAPI.network?.getLocalIP?.()
        .then((ip: string) => setLocalIP(ip))
        .catch(() => setLocalIP('Non disponible'));
      window.electronAPI.network?.getToken?.()
        .then((token: string) => setServerToken(token))
        .catch(() => setServerToken(''));
    }
  }, [isElectron]);

  // Démarrer le serveur
  const handleStartServer = async () => {
    setServerStatus('loading');
    try {
      const ip = await window.electronAPI.network.startServer();
      const token = await window.electronAPI.network.getToken();
      setLocalIP(ip);
      setServerToken(token);
      setServerStatus('running');
      const newConfig: NetworkConfig = { serverIP: 'server', port: 3737, enabled: true, token };
      saveNetworkConfig(newConfig);
      setConfig(newConfig);
      setMode('server');
      toast({
        title: '✅ Serveur démarré',
        description: `Les autres PCs peuvent se connecter sur : ${ip}`,
      });
    } catch (e: any) {
      setServerStatus('stopped');
      toast({
        title: '❌ Erreur',
        description: e.message || 'Impossible de démarrer le serveur',
        variant: 'destructive',
      });
    }
  };

  // Arrêter le serveur
  const handleStopServer = async () => {
    try {
      await window.electronAPI.network.stopServer();
      setServerStatus('stopped');
      const newConfig: NetworkConfig = { serverIP: '', port: 3737, enabled: false };
      saveNetworkConfig(newConfig);
      setConfig(newConfig);
      setMode('none');
      toast({ title: '🛑 Serveur arrêté' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  // Tester la connexion client
  const handleTestConnection = async () => {
    if (!clientIP.trim()) {
      toast({ title: 'Erreur', description: "Entrez l'IP du serveur", variant: 'destructive' });
      return;
    }
    if (!clientToken.trim()) {
      toast({ title: 'Erreur', description: "Entrez le code d'accès affiché sur le PC du médecin", variant: 'destructive' });
      return;
    }
    setClientStatus('testing');
    const ok = await testNetworkConnection(clientIP.trim(), clientToken.trim());
    if (ok) {
      setClientStatus('connected');
      const newConfig: NetworkConfig = { serverIP: clientIP.trim(), port: 3737, enabled: true, token: clientToken.trim() };
      saveNetworkConfig(newConfig);
      setConfig(newConfig);
      setMode('client');
      toast({
        title: '✅ Connexion réussie',
        description: 'Ce PC est maintenant connecté au cabinet du médecin.',
      });
    } else {
      setClientStatus('disconnected');
      toast({
        title: '❌ Connexion échouée',
        description: `Impossible de joindre ${clientIP}. Vérifiez que le serveur est démarré, que le code d'accès est correct et que les PCs sont sur le même WiFi.`,
        variant: 'destructive',
      });
    }
  };

  // Déconnecter le mode client
  const handleDisconnectClient = () => {
    saveNetworkConfig({ serverIP: '', port: 3737, enabled: false });
    setConfig({ serverIP: '', port: 3737, enabled: false });
    setMode('none');
    setClientStatus('disconnected');
    toast({ title: 'Déconnecté du serveur' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié !', description: text });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Comment ça fonctionne ?</strong><br />
              Le PC du <strong>médecin</strong> démarre en mode <strong>Serveur</strong>, le PC de la <strong>secrétaire</strong> se connecte en mode <strong>Client</strong>.
              Les deux doivent être sur le <strong>même WiFi</strong>. Toutes les données (patients, RDV, consultations) seront partagées en temps réel.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statut actuel */}
      {mode !== 'none' && (
        <Card className={mode === 'server' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === 'server' ? <Server className="w-5 h-5 text-green-600" /> : <Laptop className="w-5 h-5 text-purple-600" />}
              <div>
                <p className="font-semibold text-sm">
                  Mode actif : {mode === 'server' ? '🖥️ Serveur (PC Médecin)' : '💻 Client (PC Secrétaire)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode === 'server' ? `IP: ${localIP} — Port: 3737` : `Connecté à: ${config.serverIP}`}
                </p>
              </div>
            </div>
            <Badge variant={mode === 'server' ? 'default' : 'secondary'} className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Actif
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Mode Serveur ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-5 h-5 text-green-600" />
              Mode Serveur
            </CardTitle>
            <CardDescription>
              PC du Médecin — Partage les données avec les autres PCs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverStatus === 'running' || mode === 'server' ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 space-y-2">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    ✅ Serveur actif
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white dark:bg-black px-2 py-1 rounded border font-mono">{localIP}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(localIP)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Donnez cette adresse IP à la secrétaire pour qu'elle puisse se connecter.
                  </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-green-200 dark:border-green-800 mt-1">
                    <code className="text-sm bg-white dark:bg-black px-2 py-1 rounded border font-mono truncate max-w-[180px]">{serverToken || '...'}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(serverToken)} disabled={!serverToken}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Code d'accès unique à cette installation — communiquez-le aussi à la secrétaire.
                  </p>
                </div>
                <Button variant="destructive" className="w-full gap-2" onClick={handleStopServer}>
                  <XCircle className="w-4 h-4" />
                  Arrêter le serveur
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cliquez sur "Démarrer" pour partager vos données sur le réseau local. Le serveur s'arrêtera quand vous fermerez l'application.
                </p>
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleStartServer}
                  disabled={serverStatus === 'loading' || mode === 'client'}
                >
                  {serverStatus === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Démarrage...</>
                  ) : (
                    <><Server className="w-4 h-4" /> Démarrer le serveur</>
                  )}
                </Button>
                {mode === 'client' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Désactivez le mode client d'abord
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Mode Client ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Laptop className="w-5 h-5 text-purple-600" />
              Mode Client
            </CardTitle>
            <CardDescription>
              PC de la Secrétaire — Se connecte au PC du médecin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'client' && clientStatus === 'connected' ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-3">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                    ✅ Connecté au serveur
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Serveur : <strong>{config.serverIP}</strong>
                  </p>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={handleDisconnectClient}>
                  <XCircle className="w-4 h-4" />
                  Se déconnecter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="serverIP">Adresse IP du serveur (PC Médecin)</Label>
                  <Input
                    id="serverIP"
                    placeholder="ex: 192.168.1.10"
                    value={clientIP}
                    onChange={(e) => setClientIP(e.target.value)}
                    disabled={mode === 'server'}
                  />
                  <p className="text-xs text-muted-foreground">
                    L'IP est affichée sur le PC du médecin quand le serveur est démarré.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serverToken">Code d'accès (PC Médecin)</Label>
                  <Input
                    id="serverToken"
                    placeholder="Code affiché sous l'IP du serveur"
                    value={clientToken}
                    onChange={(e) => setClientToken(e.target.value)}
                    disabled={mode === 'server'}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleTestConnection}
                  disabled={clientStatus === 'testing' || mode === 'server' || !clientIP.trim() || !clientToken.trim()}
                >
                  {clientStatus === 'testing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Test en cours...</>
                  ) : (
                    <><Wifi className="w-4 h-4" /> Tester et Connecter</>
                  )}
                </Button>
                {mode === 'server' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Désactivez le mode serveur d'abord
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guide rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Guide de configuration rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-green-600" /> Sur le PC du Médecin</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside text-xs">
                <li>Aller dans Paramètres → Réseau</li>
                <li>Cliquer sur <strong>"Démarrer le serveur"</strong></li>
                <li>Noter l'adresse IP affichée (ex: 192.168.1.10)</li>
                <li>Laisser l'application ouverte</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2"><Laptop className="w-4 h-4 text-purple-600" /> Sur le PC de la Secrétaire</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside text-xs">
                <li>Aller dans Paramètres → Réseau</li>
                <li>Saisir l'IP du médecin dans le champ</li>
                <li>Cliquer sur <strong>"Tester et Connecter"</strong></li>
                <li>Si ✅, les données sont partagées !</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
