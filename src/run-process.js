const readline = require("readline");
const { DownloadMangaOnlineBlog } = require("./download-manga");
const fs = require("fs");
const path = require("path");
const { PDFGenerator } = require("./pdf");
const { PdfToEpubConverter } = require("./pdf-to-epub");
class RunProcess {
  static async run() {
    //Perguntar ao usuário a url do manga
    const mangaUrl = await this.askQuestion("Informe a URL do mangá: ");

    console.log(`Buscando capítulos disponíveis em ${mangaUrl}...`);

    let chapters = await DownloadMangaOnlineBlog.listCaptions({
      urlManga: mangaUrl,
    });
    //Inverte a ordem dos capítulos
    chapters = chapters.reverse();
    if (chapters.length === 0) {
      console.error("Nenhum capítulo encontrado nessa URL.");
      return;
    }

    console.log("Capítulos encontrados:");
    chapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.chapterName}`);
    });

    const selectedIndexes = await this.askQuestion(
      "Digite os números dos capítulos que deseja baixar, separados por vírgula ou * para baixar todos: "
    );


    const selectedChapters = (selectedIndexes=='*'? chapters: selectedIndexes
      .split(",")
      .map((index) => parseInt(index.trim()) - 1)
      .filter((i) => i >= 0 && i < chapters.length)
      .map((i) => chapters[i]));

    if (selectedChapters.length === 0) {
      console.log("Nenhum capítulo selecionado. Finalizando...");
      return;
    }

    console.log(`Baixando ${selectedChapters.length} capítulos...`);

    for (let chapter of selectedChapters) {
      // Pasta para salvar os arquivos
      const downloadsDir = path.join(__dirname, "downloads");

      //Verifica se a pasta já existe e cria se não existir
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir);
      }

      const chapterDir = path.join(downloadsDir, chapter.chapterName);
      //Verifica se a pasta já existe e cria se não existir
      if (!fs.existsSync(chapterDir)) {
        fs.mkdirSync(chapterDir);
      }

      console.log(`Baixando imagens do capítulo ${chapter.chapterName}...`);
      await DownloadMangaOnlineBlog.extrairImagensCapitulo({
        urlCapitulo: chapter.chapterURL,
        nomePasta: "downloads/" + chapter.chapterName,
      });

      await PDFGenerator.gerarPdfComImagens(
        "downloads/" + chapter.chapterName,
        `pdfs/${chapter.chapterName}.pdf`
      );
       await DownloadMangaOnlineBlog.apagarImagens(
        "downloads/" + chapter.chapterName
      );
      console.log(
        `Capítulo ${chapter.chapterName} baixado e convertido para PDF.`
      );

        console.log(`Convertendo PDF para EPUB: ${chapter.chapterName}.pdf -> ${chapter.chapterName}.epub`);
        await  new Promise((resolve) => setTimeout(resolve, 5000));
        await PdfToEpubConverter.converterPdfParaEpub(
            `pdfs/${chapter.chapterName}.pdf`,
            `epubs/${chapter.chapterName}.epub`
        );

      
      console.log(`Capítulo ${chapter.chapterName} convertido para EPUB.`);

      console.log(`Capítulo ${chapter.chapterName} finalizado.`);
      await DownloadMangaOnlineBlog.apagarImagens("images");

      //await DownloadMangaOnlineBlog.apagarImagens("downloads");
      //await DownloadMangaOnlineBlog.apagarImagens('pdfs');
      //Colocar um delay de 5 segundos entre cada capítulo
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  static askQuestion(query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

module.exports = { RunProcess };
