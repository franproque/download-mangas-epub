const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

class DownloadMangaOnlineBlog {
  static async listCaptions({ urlManga }) {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: false }); // Lançar o navegador (sem interface gráfica)
      const page = await browser.newPage(); // Criar uma nova aba no navegador
      
      // Acessar a URL
      await page.goto(urlManga, {
        waitUntil: "domcontentloaded", // Espera até que o DOM esteja carregado
        timeout: 10000, // Timeout de 10 segundos
      });

      // Esperar a página carregar completamente
      await page.waitForSelector("ul.main.version-chap.no-volumn.active");

      // Selecionar o conteúdo necessário e extrair os dados
      const chapters = await page.$$eval(
        "ul.main.version-chap.no-volumn.active li.wp-manga-chapter",
        (chapterElements) => {
          return chapterElements.map((chapter) => {
            const chapterName = chapter.querySelector("a").textContent.trim();
            const chapterURL = chapter.querySelector("a").href;
            return { chapterName, chapterURL };
          });
        }
      );

      // Exibir os capítulos extraídos
      
      return chapters.map(({ chapterName, chapterURL }) => {
        return ({ chapterName, chapterURL });
      });
    } catch (error) {
      console.error("Erro ao buscar ou processar a página:", error.message);
    } finally {
      if (browser) {
        await browser.close(); // Fechar o navegador
      }
    }
  }
   // Função para extrair imagens e salvar no disco
  // Função para extrair imagens e salvar no disco
 // Função para extrair imagens e salvar no disco
 static async extrairImagensCapitulo({ urlCapitulo, nomePasta }) {
  let browser;
  try {
    // Inicia o Puppeteer
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Acessa a URL do capítulo e aguarda o carregamento completo
    await page.goto(urlCapitulo, {
      waitUntil: 'domcontentloaded',  // Aguarda o carregamento completo da página
      timeout: 20000,     // Timeout de 10 segundos
    });
    // Chama a função para extrair as imagens
    const imagensPorPagina = await this.extrairImagens(page);
    
    // Salva as imagens no disco
    await this.salvarImagens(imagensPorPagina, nomePasta);

    // Após salvar as imagens, você pode chamar a função para juntar imagens divididas
    await this.juntarImagens(nomePasta); // Juntar as imagens da pasta

  } catch (error) {
    console.error('Erro ao buscar ou processar a página:', error.message);
  } finally {
    if (browser) {
      await browser.close(); // Fecha o navegador após a extração
    }
  }
}

// Função para extrair as imagens dentro de cada .theimage (várias imagens por página)
static async extrairImagens(page) {
  // Espera até que as imagens estejam carregadas
  await new Promise(resolve => setTimeout(resolve, 25000));
  await page.waitForSelector('div.reading-content div.page-break .theimage img', { timeout: 20000 });
  // Extrai as imagens Base64 dentro de cada .theimage
  const imagensPorPagina = await page.$$eval(
    'div.reading-content div.page-break .theimage',
    (pages) => {
      return pages.map((page) => {
        const imgs = page.querySelectorAll('img'); // Pega todas as imagens dentro de .theimage
        return Array.from(imgs).map((img) => img.src);  // Extrai o src de cada imagem (Base64)
      });
    }
  );

  return imagensPorPagina; // Retorna um array de arrays de imagens Base64
}

// Função para salvar as imagens no disco
static async salvarImagens(imagensPorPagina, nomePasta) {
  // Cria a pasta se não existir
  const pastaDestino = path.join(__dirname, nomePasta);
  if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
  }

  let pageCounter = 1;

  // Salva as imagens para cada página
  for (const imagensPagina of imagensPorPagina) {
    const pagePath = path.join(pastaDestino, `pagina_${pageCounter}`);
    if (!fs.existsSync(pagePath)) {
      fs.mkdirSync(pagePath, { recursive: true });
    }

    let imageCounter = 1;
    for (const base64Data of imagensPagina) {
      // Verifica se a imagem é uma Base64 válida
      if (base64Data.startsWith('data:image')) {
        // Extrai o tipo de imagem (por exemplo, png, jpeg, etc.)
        const regex = /^data:image\/([a-zA-Z]*);base64,/;
        const matches = base64Data.match(regex);
        let extension = matches ? matches[1] : 'png';  // Definindo 'png' como padrão se não encontrar o tipo

        // Remove o prefixo Base64
        const base64Image = base64Data.replace(/^data:image\/[a-zA-Z]*;base64,/, '');
        const filePath = path.join(pagePath, `imagem_${imageCounter}.${extension}`);
        //Quero que todas as imagens sejam salvas em png com a melhor qualidade e tamanho possível
      
          const base64DataWebp = base64Image;
          const base64Content = base64DataWebp.replace(/^data:image\/.*?;base64,/, ''); // Remove o prefixo Base64
          const bufferData = Buffer.from(base64Content, 'base64');
          await sharp(bufferData)
          .png({quality: 100})
          .toFile(filePath)
          .then(() => {
            console.log(`Imagem ${imageCounter} salva em: ${filePath}`);
            extension = 'png';
          })
          .catch((err) => {
            console.error(`Erro ao salvar a imagem ${imageCounter}: ${err.message}`);
          });
             
        imageCounter++;
      }
    }

    pageCounter++;
  }
}

// Função para juntar as imagens de cada página
static async juntarImagens(nomePasta) {
  const pastaDestino = path.join(__dirname, nomePasta);
  const dirs = fs.readdirSync(pastaDestino, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Para cada página, vamos juntar as imagens
  for (const dir of dirs) {
    const pagePath = path.join(pastaDestino, dir);
    const files = fs.readdirSync(pagePath).filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')
    ); // Permitir imagens PNG, JPG, e JPEG

    console.log(`Imagens encontradas para a página ${dir}: ${files.length}`);

    const imagensParaJuntar = [];
    let totalHeight = 0;
    let totalWidth = 0;

    // Obtém as imagens para manipulação
    for (const file of files) {
      const imagePath = path.join(pagePath, file);

      try {
        const img = await loadImage(imagePath);
        imagensParaJuntar.push(img);

      } catch (err) {
        console.error(`Erro ao carregar a imagem ${file}: ${err.message}`);
      }
    }

    // Se não houver imagens para juntar, pule esta página
    if (imagensParaJuntar.length === 0) {
      console.log(`Nenhuma imagem válida encontrada para a página ${dir}`);
      continue;
    }

    // A largura final é a soma da largura da imagem 2 e 1, e a altura final é a soma da imagem 2 e 4
    // Aqui, estamos assumindo que você tem sempre 4 imagens para cada página
    const img1 = imagensParaJuntar[0]; // Imagem 1
    const img2 = imagensParaJuntar[1]; // Imagem 2
    const img3 = imagensParaJuntar[2]; // Imagem 3
    const img4 = imagensParaJuntar[3]; // Imagem 4

    const larguraFinal = img2.width + img1.width; // Soma das larguras de 2 e 1
    const alturaFinal = img2.height + img4.height; // Soma das alturas de 2 e 4

    // Cria o canvas com as dimensões finais
    const canvas = createCanvas(larguraFinal, alturaFinal);
    const ctx = canvas.getContext('2d');

    // Desenha a primeira linha (imagens 2 e 1)
    ctx.drawImage(img2, 0, 0); // Imagem 2
    ctx.drawImage(img1, img2.width, 0); // Imagem 1 à direita de 2

    // Desenha a segunda linha (imagens 4 e 3)
    ctx.drawImage(img4, 0, img2.height); // Imagem 4 abaixo de 2
    ctx.drawImage(img3, img4.width, img2.height); // Imagem 3 à direita de 4

    // Salva a imagem combinada como JPEG
    const buffer = canvas.toBuffer('image/png');
    //Melhorar a qualidade da imagem

    const outputPath = path.join(pastaDestino, `${dir}_final_canvas.png`);
    fs.writeFileSync(outputPath, buffer);

    console.log(`Imagens combinadas para a página ${dir} com sucesso!`);
  }
}
static async apagarImagens(nomePasta) {
  const pastaDestino = path.join(__dirname, nomePasta);
  if (fs.existsSync(pastaDestino)) {
    fs.rmdirSync(pastaDestino, { recursive: true });
    console.log(`Pasta ${nomePasta} apagada com sucesso!`);
  } else {
    console.log(`Pasta ${nomePasta} não encontrada.`);
  }
}
}

module.exports = {
  DownloadMangaOnlineBlog,
};