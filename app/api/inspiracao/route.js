export async function POST(req){
  try{
    const {descricao,fotoBase64}=await req.json()

    const content=fotoBase64
      ?[
          {type:'image',source:{type:'base64',media_type:'image/jpeg',data:fotoBase64}},
          {type:'text',text:`Cliente de salão de beleza enviou foto de referência${descricao?` e descreveu: "${descricao}"`:''}.
Crie um prompt em inglês simples (máximo 15 palavras) para gerar imagem de inspiração de beleza.
Responda APENAS com o prompt em inglês.`}
        ]
      :[{type:'text',text:`Cliente de salão de beleza descreveu: "${descricao}".
Crie um prompt em inglês simples (máximo 15 palavras) para gerar imagem de inspiração de beleza.
Responda APENAS com o prompt em inglês.`}]

    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':process.env.ANTHROPIC_API_KEY||'',
        'anthropic-version':'2023-06-01'
      },
      body:JSON.stringify({
        model:'claude-haiku-4-5-20251001',
        max_tokens:60,
        messages:[{role:'user',content}]
      })
    })
    const json=await res.json()
    const prompt=json.content?.[0]?.text?.trim()||descricao
    return Response.json({ok:true,prompt})
  }catch(e){
    return Response.json({ok:false,prompt:null})
  }
}
