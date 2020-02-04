import FrmPadrao from '../../padrao/frmPadrao';
import React from 'react';
import MasterPage from '../../components/MasterPage';
import api, { baseURLAPI } from '../../services/api';
import { getBase64 } from '../../services/utils';
import { Form, Input, Button, Icon, Dropdown, Upload, Menu, InputNumber } from 'antd';
import { Breadcrumb, Card } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';

class AlterarParceiro extends FrmPadrao {

  state = {
    idParceiro: 0,
    loading: false,
    tinyEditor: null
  };

  async componentDidMount() {
    this.setState({ loading: true });
    try {
      let id = this.props.match.params.id;
      this.setState({ idParceiro: id });
      let res = await api.get(`/parceiro/${id}`);
      this.props.form.setFieldsValue({
        ...res.data
      });
      if (res.data.imagem) {
        this.setState({ imageUrl: baseURLAPI + '/' + res.data.imagem });
      }
      if (this.state.tinyEditor) {
        this.state.tinyEditor.setContent(res.data.parceiro);
      }
    } finally {
      this.setState({ loading: false });
    }
    console.log(this.state);
  }

  handleEditorChange = (e) => {
    e.target.value = e.target.getContent();
  }

  imgBeforeUpload = file => {
    const isJpgOrJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    if (!isJpgOrJpeg) {
      this.getMessageError('Você só pode fazer upload de imagens no formato JPG/JPEG!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.getMessageError('A imagem deve ter no máximo 2 megabytes!');
    }
    return isJpgOrJpeg && isLt2M;
  }

  handleChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj, imageUrl => 
        this.setState({
          imageUrl,
          loading: false,
        }),
      );
    }
  };

  //  SUBMIT
  handleSubmit = e => {
    e.preventDefault();
    this.setState({ loading: true });
    // Gerando Request
    this.props.form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const formData = new FormData();
        Object.keys(values).forEach(function (item) {
          if (item !== "imagem") {
            formData.append(item, values[item]);
          }
        });
        if (values.imagem) {
          if (values.imagem.file) {
            // Upload de nova imagem
            formData.append("imagem", values.imagem.file.originFileObj);
          } else {
            formData.append("imagem", values.imagem);
          }
        }
        try {
          console.log(`/alterarparceiro/${this.state.idParceiro}`);
          const response = await api.put(`/alterarparceiro/${this.state.idParceiro}`, formData);
          console.log(response);
          if (response.status === 200) {
            this.getMessageSuccess("Salvo com sucesso!");
          } else {
            this.getMessageError(response.statusText);
            console.log(response);
          }
        } catch (error) {
          if (error.response) {
            if (error.response.status === 403) {
              if (error.response.data.msg) {
                this.getMessageAlert(error.response.data.msg);
              }
            }
          } else {
            console.log('Error', error.message);
          }
          console.log(error);
        } finally {
          this.setState({ loading: false });
        }
      }
    });
  }

  excluirImagemHandle = e => {
    this.setState({ imageUrl: null });
    this.props.form.setFieldsValue({imagem: null});
  };

  render() {

    const { getFieldDecorator } = this.props.form;
    const { imageUrl } = this.state;

    const deleteImageMenu = (
      <Menu>
        <Menu.Item key="1" onClick={this.excluirImagemHandle}>
          <Icon type="delete" />Excluir Imagem
        </Menu.Item>
      </Menu>
    );

    const uploadButton = (
      <div>
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
        <div className="ant-upload-text">Selecione uma Imagem</div>
      </div>
    );

    return (

      <MasterPage tituloCabecalho='titulo inicial'>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Início</Breadcrumb.Item>
          <Breadcrumb.Item href="/admin/parceiros">Parceiros</Breadcrumb.Item>
          <Breadcrumb.Item active>Alterar Parceiro ({this.state.idParceiro})</Breadcrumb.Item>
        </Breadcrumb>

        <Card>
          <Card.Body>
            <Form {...this.layoutSideBySyde} onSubmit={this.handleSubmit} contextMenu="" >

              <Form.Item
                label={<span>Nome</span>}>
                {getFieldDecorator('nome', {
                  rules: [{ required: true, message: 'Informe o nome do Parceiro!', whitespace: true }],
                })(<Input />)}
              </Form.Item>

              <Form.Item
                label={<span>Endereço</span>}>
                {getFieldDecorator('endereco', {
                  rules: [{ required: true, message: 'Informe o endereço do parceiro!', whitespace: true }],
                })(<Input />)}
              </Form.Item>

              <Form.Item
                label={<span>Telefone</span>}>
                {getFieldDecorator('telefone', {
                  rules: [{ required: true, message: 'Informe o telefone do parceiro!', whitespace: true }],
                })(<Input />)}
              </Form.Item>

              <Form.Item label="Ordem (1, 2, 3, etc...)">
                {getFieldDecorator('ordem', {
                  rules: [{ required: true, message: 'Informe ordem de exibição do parceiro!' }],
                })(<InputNumber min={1} max={99} style={{ width: '100%' }} />)}
              </Form.Item>

              <Dropdown overlay={deleteImageMenu} trigger={['contextMenu']}>
                <Form.Item label="Imagem">
                  {getFieldDecorator('imagem', {
                  rules: [{ required: true, message: 'Informe a imagem de exibição do parceiro!' }],
                })(
                    <Upload name="imagem"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      beforeUpload={this.imgBeforeUpload}
                      onChange={this.handleChange}
                      customRequest={this.imgDummyReq}
                    >
                      {imageUrl ? <img src={imageUrl} alt=""
                        style={{ width: '100%' }} /> : uploadButton}

                    </Upload>
                  )}
                </Form.Item>
              </Dropdown>

              <h6>Sobre o parceiro</h6>
              <Form.Item {...this.LayoutFullWidth}>
                {getFieldDecorator('sobre', {
                  rules: [{ required: true, message: 'Informe um texto promocionaç sobre o parceiro!' }],
                })(
                  <Editor
                    init={{
                      setup: editor => {
                        this.setState({ tinyEditor: editor })
                      },
                      paste_data_images: true,
                      language_url: '/languages/pt_BR.js',
                      language: 'pt_BR',
                      height: 300,
                      branding: false,
                      images_upload_handler: function (blobInfo, success, failure) {
                        success("data:" + blobInfo.blob().type + ";base64," + blobInfo.base64());
                      },
                      init_instance_callback: function (editor) {
                        var freeTiny = document.querySelector('.tox .tox-notification--in');
                        freeTiny.style.display = 'none';
                      },
                      plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table code paste code wordcount'
                      ],
                      toolbar:
                        'undo redo | formatselect | bold italic backcolor | \
                        alignleft aligncenter alignright alignjustify | \
                        bullist numlist outdent indent | removeformat | image'
                    }}
                    onChange={this.handleEditorChange}
                  />
                )}
              </Form.Item>
              <Form.Item {...this.Layout2ColsEm1}>
                <Button type="primary"
                  htmlType="submit"
                  disabled={this.state.loading}
                  loading={this.state.loading}>
                  Salvar
              </Button>
              </Form.Item>
            </Form>
          </Card.Body>
        </Card>
      </MasterPage>
    )
  }
}


export default Form.create()(AlterarParceiro);