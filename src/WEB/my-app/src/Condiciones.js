import React from 'react';
import { Link } from 'react-router-dom';
import './css/main.css'; 

function Condiciones() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title">Términos y Condiciones de Uso</h1>
            </div>
            <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p><strong>Fecha de última actualización:</strong> 9 de Diciembre de 2025</p>

              <h2>1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar nuestra aplicación, usted acepta estar sujeto a estos Términos y Condiciones, 
                todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de las leyes 
                locales aplicables. Si no está de acuerdo con alguno de estos términos, se le prohíbe usar o acceder a este sitio.
              </p>

              <h2>2. Uso de la Licencia</h2>
              <p>
                Se concede permiso para descargar temporalmente una copia de los materiales (información o software) en 
                el sitio web para visualización transitoria personal y no comercial únicamente. Esta es la concesión de una 
                licencia, no una transferencia de título, y bajo esta licencia no puede:
              </p>
              <ul>
                <li>Modificar o copiar los materiales.</li>
                <li>Usar los materiales para cualquier propósito comercial, o para cualquier exhibición pública (comercial o no comercial).</li>
                <li>Intentar descompilar o realizar ingeniería inversa de cualquier software contenido en el sitio web.</li>
                <li>Eliminar cualquier derecho de autor u otras anotaciones de propiedad de los materiales.</li>
              </ul>

              <h2>3. Política de Privacidad y Tratamiento de Datos</h2>
              <p>
                La recogida y uso de información personal a través de nuestra aplicación se rige por nuestra Política de Privacidad. 
                Al utilizar la aplicación, usted consiente la recopilación y el uso de datos de acuerdo con nuestra política, 
                incluida la recopilación de datos de sensores ambientales (CO2, NO2, O3, etc.) asociados a su ubicación. 
                Estos datos se utilizan para proporcionar los servicios de la aplicación, como la visualización de la calidad del aire 
                y la interpolación de datos en mapas. Los datos se almacenan de forma segura y no se compartirán con terceros con 
                fines comerciales sin su consentimiento explícito.
              </p>

              <h2>4. Limitaciones</h2>
              <p>
                En ningún caso la empresa o sus proveedores serán responsables de los daños (incluidos, entre otros, los daños 
                por pérdida de datos o beneficios, o debido a la interrupción del negocio) que surjan del uso o la imposibilidad 
                de usar los materiales en el sitio web, incluso si la empresa o un representante autorizado ha sido notificado 
                oralmente o por escrito de la posibilidad de dicho daño.
              </p>

              <h2>5. Modificaciones de los Términos</h2>
              <p>
                Podemos revisar estos términos de servicio para su sitio web en cualquier momento sin previo aviso. Al usar 
                este sitio web, usted acepta estar sujeto a la versión actual de estos términos de servicio.
              </p>
            </div>
            <div className="card-footer text-center">
              <Link to="/registro" className="btn btn-primary">Volver al Registro</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Condiciones;
