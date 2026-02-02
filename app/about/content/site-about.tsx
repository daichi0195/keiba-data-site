import styles from '@/components/article-content.module.css';

export default function SiteAbout() {
  return (
    <>
      <h2 className={styles.heading}>競馬データ.comについて</h2>
      <p className={styles.text}>
        競馬データ.comは、競馬予想に役立つデータやコラム等を発信するサイトです！
      </p>
      <p className={styles.text}>
        競馬のデータって、専用の分析ツールを使うにはお金がかかるし、かといってググっても最新のデータがなかったり怪しい予想サイトに誘導されたり...みたいな経験ないですか？
      </p>
      <p className={styles.text}>
        「なら自分で0からデータベースを作って使いやすいサイトを作ろう」というのが、このサイトの出発点です。
      </p>
      <p className={styles.text}>
        一人で運営しているのでなかなか手が回らない部分もあるかと思いますが、「世界で1番使いやすい競馬メディア」を目指して頑張ります！
      </p>
    </>
  );
}
