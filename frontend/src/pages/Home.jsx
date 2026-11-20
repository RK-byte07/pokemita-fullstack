import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';

import battleArena from '../assets/images/pokemon-battle-arena.png';


const features = [
  [
    'sword',
    'Battle Lab',
    'Simula combates Gen 9 OU con un motor competitivo real.',
    '/simulador',
    'ENTRAR A LA ARENA'
  ],
  [
    'search',
    'Pokédex táctica',
    'Explora tipos, tiers y estadísticas para construir con criterio.',
    '/pokedex',
    'EXPLORAR DATOS'
  ],
  [
    'trophy',
    'Meta competitivo',
    'Conoce las amenazas y fundamentos del formato actual.',
    '/meta',
    'ANALIZAR META'
  ],
];


export default function Home() {

  const { isAuthenticated, user } = useAuth();


  return (

    <div className="overflow-hidden">


      {/* HERO FULL IMAGE */}

      <section
        className="
        relative
        min-h-[760px]
        overflow-hidden
        border-b
        border-white/10
        "
      >


        {/* IMAGEN DE FONDO */}

        <img
          src={battleArena}
          alt="Batalla Pokémon competitiva"
          className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
          "
        />


        {/* OSCURECER IMAGEN */}

        <div
          className="
          absolute
          inset-0
          bg-void/80
          "
        />


        {/* GRID */}

        <div
          className="
          absolute
          inset-0
          grid-pattern
          opacity-30
          "
        />



        {/* CONTENIDO */}

        <div
          className="
          page-container
          relative
          flex
          min-h-[760px]
          items-center
          "
        >


          <div
            className="
            max-w-3xl
            "
          >



            <span className="eyebrow">

              PLATAFORMA COMPETITIVA · GEN 9 OU

            </span>





            <h1
              className="
              mt-6
              text-6xl
              font-black
              leading-[.9]
              tracking-tight
              text-white
              sm:text-8xl
              "
            >

              CONSTRUYE.

              <br/>

              <span className="text-brand">
                COMBATE.
              </span>

              DOMINA.


            </h1>





            <p
              className="
              mt-8
              max-w-xl
              text-lg
              leading-relaxed
              text-slate-200
              "
            >

              Una estación de entrenamiento para jugadores que quieren convertir
              decisiones, datos y estrategia en victorias.

            </p>




            {
              isAuthenticated && (

                <p className="mt-4 font-bold text-info">

                  Bienvenido al centro de mando, {user?.username}.

                </p>

              )
            }





            <div
              className="
              mt-10
              flex
              flex-wrap
              gap-4
              "
            >


              <Link
                to={isAuthenticated ? '/simulador' : '/register'}
                className="cta-button"
              >

                {
                  isAuthenticated
                  ? 'Abrir simulador'
                  : 'Crear perfil competitivo'
                }

                <Icon name="arrow"/>

              </Link>




              <Link
                to="/meta"
                className="secondary-button"
              >

                <Icon name="trophy"/>

                Ver meta actual


              </Link>


            </div>






            <div
              className="
              mt-14
              flex
              gap-12
              border-t
              border-white/20
              pt-8
              "
            >


              {[
                ['01','Motor Showdown'],
                ['06','Slots por equipo'],
                ['∞','Simulaciones']
              ].map(([value,label])=>(


                <div key={label}>


                  <b
                    className="
                    block
                    text-3xl
                    font-black
                    text-white
                    "
                  >

                    {value}

                  </b>


                  <span
                    className="
                    text-xs
                    uppercase
                    tracking-widest
                    text-slate-300
                    "
                  >

                    {label}

                  </span>


                </div>


              ))}



            </div>




          </div>


        </div>


      </section>







      {/* CARDS */}

      <section className="page-container py-20">


        <div className="mb-10">

          <span className="eyebrow">
            TU CENTRO DE MANDO
          </span>


          <h2 className="mt-3 text-3xl font-black text-white">
            Todo lo necesario para competir
          </h2>

        </div>




        <div className="grid gap-5 lg:grid-cols-3">


          {
            features.map(([icon,title,text,to,cta],i)=>(


              <Link
                key={title}
                to={to}
                className="
                group
                rounded-2xl
                border
                border-white/10
                bg-card
                p-7
                transition
                hover:-translate-y-1
                hover:border-brand/40
                "
              >


                <span
                  className={`
                  grid
                  h-12
                  w-12
                  place-items-center
                  rounded-xl

                  ${
                    i===1
                    ? 'bg-info/10 text-info'
                    :
                    i===2
                    ? 'bg-special/10 text-special'
                    :
                    'bg-brand/10 text-brand'
                  }

                  `}
                >

                  <Icon
                    name={icon}
                    size={25}
                  />

                </span>



                <h3 className="mt-6 text-xl font-black text-white">

                  {title}

                </h3>



                <p className="mt-3 text-sm text-slate-400">

                  {text}

                </p>



                <span
                  className="
                  mt-7
                  flex
                  gap-2
                  text-xs
                  font-black
                  text-brand
                  "
                >

                  {cta}

                  <Icon name="arrow" size={16}/>

                </span>


              </Link>


            ))
          }



        </div>



      </section>



    </div>

  );

}