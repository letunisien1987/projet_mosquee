import ServiceRequestForm from '@/components/ServiceRequestForm'
import { Heart, Users, BookOpen, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ServicesPage() {
    const services = [
        {
            title: 'Mariage',
            icon: Heart,
            description: 'Célébration de votre union selon les rites islamiques',
            details: [
                'Cérémonie religieuse',
                'Accompagnement spirituel',
                'Conseils pré-matrimoniaux',
                'Documentation officielle',
            ],
        },
        {
            title: 'Funérailles',
            icon: Users,
            description: 'Accompagnement dans les moments difficiles',
            details: [
                'Prière funéraire (Salat al-Janazah)',
                'Soutien aux familles',
                'Coordination avec les autorités',
                'Conseils sur les rites funéraires',
            ],
        },
        {
            title: 'Shahada',
            icon: Sparkles,
            description: 'Attestation de foi pour les nouveaux musulmans',
            details: [
                'Accompagnement personnalisé',
                'Cérémonie de conversion',
                'Cours d\'introduction à l\'Islam',
                'Certificat de conversion',
            ],
        },
        {
            title: 'Aqiqa',
            icon: BookOpen,
            description: 'Sacrifice de naissance pour célébrer l\'arrivée d\'un enfant',
            details: [
                'Organisation du sacrifice',
                'Distribution de la viande',
                'Conseils sur les traditions',
                'Prières pour le nouveau-né',
            ],
        },
    ]

    return (
        <div className="space-y-12 md:space-y-16">
            <section className="bg-primary text-primary-foreground py-20 md:py-32">
                <div className="container text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Services Religieux</h1>
                    <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
                        La Mosquée Madretsch vous accompagne dans les moments importants de votre vie
                    </p>
                </div>
            </section>

            <section className="container">
                <h2 className="text-3xl font-bold text-center mb-12">Nos Services</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => {
                        const Icon = service.icon
                        return (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle>{service.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">{service.description}</p>
                                    <ul className="space-y-2">
                                        {service.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <span className="text-primary mt-1">✓</span>
                                                <span className="text-muted-foreground">{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </section>

            <section className="container max-w-4xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Faire une Demande</h2>
                    <p className="text-muted-foreground">
                        Remplissez le formulaire ci-dessous pour demander un service
                    </p>
                </div>
                <ServiceRequestForm />
            </section>

            <section className="container max-w-4xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Questions ?</h2>
                    <p className="text-muted-foreground mb-6">
                        Pour toute question concernant nos services, n'hésitez pas à nous contacter
                    </p>
                    <div className="space-y-2">
                        <p>
                            <strong>Email :</strong>{' '}
                            <a href="mailto:services@mosquee-madretsch.ch" className="text-primary hover:underline">
                                services@mosquee-madretsch.ch
                            </a>
                        </p>
                        <p>
                            <strong>Téléphone :</strong>{' '}
                            <a href="tel:+41123456789" className="text-primary hover:underline">
                                +41 12 345 67 89
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
