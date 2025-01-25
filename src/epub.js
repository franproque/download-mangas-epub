const fs = require('fs');
const path = require('path');
const Epub = require('epub-gen');
const ncp = require('ncp').ncp;

class EPubGenerator {
  static async gerarEpubComImagens(nomePasta, nomeArquivoEpub) {
    const pastaImagens = path.join(__dirname, nomePasta);
    const pastaDestino = path.join(__dirname, 'images');
    // Verifica se a pasta de imagens existe
    if (!fs.existsSync(pastaImagens)) {
      console.error(`Pasta ${nomePasta} não encontrada`);
      return;
    }

    // Verifica se a pasta images existe, caso contrário cria ela
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino);
    }

    const dirs = fs.readdirSync(pastaImagens);
    const pages = [];

    console.log(`Pasta ${nomePasta} possui ${dirs.length} páginas`);

    // Para cada página, vamos adicionar as imagens combinadas ao EPUB
    for (let dir of dirs) {
      const dirPath = path.join(pastaImagens, dir);
      // Verifica se o caminho é um diretório
      console.log(`Verificando ${dirPath}`);
        if (dir.endsWith('.png') || dir.endsWith('.jpg') || dir.endsWith('.jpeg') || dir.endsWith('.webp')) {
          const destFilePath = path.join(pastaDestino, dir);
          
          // Copiar a imagem para a pasta 'images/'
          fs.copyFileSync(dirPath, destFilePath);
          
          console.log(`Imagem ${dirPath} copiada para ${destFilePath}`);
          // Adicionar ao EPUB
          console.log(`Adicionando imagem ${destFilePath} ao EPUB`);
          pages.push({
            data: `<img src="${destFilePath}" />` // Referencia diretamente o arquivo
          });
        }
      }
    

    // Configuração do EPUB
    const options = {
      title: "Manga",
      author: "Autor do Manga",
      output: path.join(__dirname, nomeArquivoEpub),
      content: pages,
    };

    // Criação do EPUB
    try {
      const epub = new Epub(options);
      await epub.promise;
      console.log(`EPUB gerado com sucesso: ${nomeArquivoEpub}`);
    } catch (error) {
      console.error("Erro ao gerar o EPUB:", error.message);
    }
  }
}

module.exports = { EPubGenerator };
