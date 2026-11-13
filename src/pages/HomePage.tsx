import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileText, Baby, Heart, Stamp, Cross, Clock, DollarSign, ClipboardList, ArrowRight, Calendar, CheckCircle, Phone, MapPin, Search } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/Button';

const iconMap: Record<string, typeof FileText> = {
  Baby,
  Heart,
  Cross,
  Stamp,
  FileText,
};

export function HomePage() {
  const { services, loading } = useServices();
  const { getContent } = useSiteContent();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                République du Cameroun · Devoir · Fidélité · Travail
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 font-serif">
                Centre d'État Civil
                <span className="block text-primary-700">de Babylone</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                {getContent('homepage_intro') || 'Bienvenue au Centre d\'État Civil de Babylone. Notre mission est de garantir l\'authenticité et la fiabilité des actes d\'état civil pour tous les citoyens.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate('/rendez-vous')}>
                  <Calendar className="h-5 w-5" /> Prendre rendez-vous
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/suivi')}>
                  <Search className="h-5 w-5" /> Suivre mon dossier
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">4</div>
                  <div className="text-xs text-gray-500 mt-1">Services principaux</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">7j/7</div>
                  <div className="text-xs text-gray-500 mt-1">Demandes en ligne</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500 mt-1">Processus officiel</div>
                </div>
              </div>
            </div>

            {/* Visual card */}
            <div className="hidden lg:block animate-scale-in">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100 -rotate-3" />
                <div className="relative glass rounded-3xl shadow-xl p-8 border border-white/40">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Rendez-vous en ligne</div>
                        <div className="text-sm text-gray-500">Simple et rapide</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {services.slice(0, 4).map((s, i) => {
                      const Icon = iconMap[s.icon] || FileText;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-primary-50 transition-all cursor-pointer hover:translate-x-1"
                          onClick={() => navigate('/rendez-vous')}
                          style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }}
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shadow-sm">
                            <Icon className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{s.title}</div>
                            <div className="text-xs text-gray-500 truncate">{s.processing_delay}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 border border-accent-100 text-accent-700 text-xs font-medium mb-4">
              <ClipboardList className="h-3 w-3" /> Guides d'information
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-serif">
              Nos Services & Démarches
            </h2>
            <p className="text-gray-600">
              Trouvez toutes les informations nécessaires pour vos démarches d'état civil: pièces requises, frais officiels et délais de traitement.
            </p>
          </div>

          {/* Service accordion cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-gray-400">Chargement des services...</div>
            ) : (
              services.map((service, idx) => {
                const Icon = iconMap[service.icon] || FileText;
                const isExpanded = expandedSlug === service.slug;
                return (
                  <div
                    key={service.id}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                    style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s both` }}
                  >
                    <button
                      onClick={() => setExpandedSlug(isExpanded ? null : service.slug)}
                      className="w-full p-6 text-left flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0 group-hover:from-primary-100 group-hover:to-primary-200 transition-colors">
                        <Icon className="h-7 w-7 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{service.short_description}</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
                          <p className="text-sm text-gray-600 leading-relaxed">{service.full_info}</p>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="rounded-xl bg-gray-50 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <ClipboardList className="h-4 w-4 text-primary-600" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pièces</span>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-pre-line">{service.required_documents}</div>
                            </div>
                            <div className="rounded-xl bg-accent-50/50 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-accent-600" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Frais</span>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-pre-line">{service.fees}</div>
                            </div>
                            <div className="rounded-xl bg-primary-50/50 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-primary-600" />
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Délais</span>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-pre-line">{service.processing_delay}</div>
                            </div>
                          </div>

                          <Button size="sm" onClick={() => navigate('/rendez-vous')} className="w-full sm:w-auto">
                            <Calendar className="h-4 w-4" /> Prendre rendez-vous pour cette démarche
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-serif">Comment ça marche ?</h2>
            <p className="text-gray-600">Trois étapes simples pour vos démarches administratives</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: '1. Prenez rendez-vous', desc: 'Choisissez votre type de démarche et sélectionnez un créneau qui vous convient.' },
              { icon: CheckCircle, title: '2. Recevez la confirmation', desc: 'Un agent traitera votre demande et vous recevrez une réponse sur votre espace citoyen.' },
              { icon: FileText, title: '3. Retirez vos documents', desc: 'Présentez-vous au centre avec les pièces requises pour retirer vos documents officiels.' },
            ].map((step, i) => (
              <div key={i} className="relative glass rounded-2xl p-8 shadow-md border border-white/40 text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick info strip */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-5 rounded-xl glass shadow-sm border border-white/40">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Adresse</div>
                <div className="text-sm font-medium text-gray-900">{getContent('center_address') || 'Babylone, Cameroun'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-xl glass shadow-sm border border-white/40">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-secondary-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</div>
                <div className="text-sm font-medium text-gray-900">{getContent('center_phone') || '+237 ...'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-xl glass shadow-sm border border-white/40">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-accent-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Horaires</div>
                <div className="text-sm font-medium text-gray-900">{getContent('center_hours_weekdays') || '07h30 - 15h30'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
